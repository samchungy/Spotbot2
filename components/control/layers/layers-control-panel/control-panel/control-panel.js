const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {actionSection, buttonActionElement, confirmObject, contextSection, imageSection, overflowActionElement, overflowOption, textSection} = require('/opt/slack/format/slack-format-blocks');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {inChannelPost, messageUpdate} = require('/opt/slack/format/slack-format-reply');
const {post, updateChat} = require('/opt/slack/slack-api');

const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

const BACK_TO_PLAYLIST = config.dynamodb.settings.back_to_playlist;
const PLAYLIST = config.dynamodb.settings.playlist;
const CONTROLLER = config.slack.actions.controller;
const CONTROLLER_OVERFLOW = config.slack.actions.controller_overflow;
const CONTROLS = config.slack.actions.controls;

const PANEL_RESPONSE = {
  context_off: (playlist, back) => `:information_source: Not playing from the Spotbot playlist: ${playlist}. ${back ? ` Spotbot will return when you add songs to the playlist.`: ``}`,
  state: `:sound: *Currently Playing...*`,
  currently_playing: (title, artist, album, duration) => `:sound: Currently Playing...\n${title}\n\n:studio_microphone: Artists: ${artist}\n:dvd: Album: ${album}\n:clock1: Duration: ${duration}`,
  currently_playing_mrkdwn: (title, url, artist, album, duration) => `<${url}|*${title}*>\n\n:studio_microphone: *Artists:* ${artist}\n:dvd: *Album*: ${album}\n:clock1: *Duration*: ${duration}`,
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  on_playlist: ':information_source: Currently playing from the Spotbot playlist.',
  paused: ':double_vertical_bar: Spotify is currently paused.',
  repeat: ' Repeat is *enabled*.',
  shuffle: ' Shuffle is *enabled*.',
};

/**
 * Updates the panel with success status, posts if successful.
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {Object} settings
 *
 * @param {String} timestamp
 * @param {string} success
 * @param {string} response
 * @param {Object} status
 */
async function responseUpdate(teamId, channelId, auth, settings, timestamp, success, response, status) {
  try {
    if (!success) {
      await updatePanel(teamId, channelId, auth, settings, timestamp, response, status);
    } else {
      if (response) {
        await Promise.all([
          updatePanel(teamId, channelId, auth, settings, timestamp, null, status),
          post(
              inChannelPost(channelId, response, null),
          ),
        ]);
      } else {
        await updatePanel(teamId, channelId, auth, settings, timestamp, null, status);
      }
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Get Current Track Panel
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} settings
 * @param {Object} status
 * @param {string} response
 * @return {Object} Control Panel Block
 */
async function getCurrentTrackPanel(teamId, channelId, settings, status, response) {
  // If we have a song playing push the currently playing stack on
  let altText; let context;
  const currentPanel = [];
  if (status && status.item) {
    const track = new Track(status.item);
    const text = PANEL_RESPONSE.currently_playing_mrkdwn(track.name, track.url, track.artists, track.album, track.duration);
    altText = PANEL_RESPONSE.currently_playing(track.name, track.artists, track.album, track.duration);
    currentPanel.push(
        textSection(PANEL_RESPONSE.state),
        imageSection(text, track.art, `Album Art`),
    );
  } else {
    // Not Playing
    altText = PANEL_RESPONSE.not_playing;
    currentPanel.push(
        textSection(PANEL_RESPONSE.not_playing),
    );
  }

  // Set the contexts
  // If we had a previous action
  if (response) {
    context = response;
  } else {
  // Check if we are playing from the playlist
    const backToPlaylist = settings[BACK_TO_PLAYLIST];
    const playlist = settings[PLAYLIST];
    if (status.context) {
      if (status.context.uri.includes(playlist.id)) {
        context = PANEL_RESPONSE.on_playlist;
      } else {
        context = PANEL_RESPONSE.context_off(`<${playlist.url}|${playlist.name}>`, backToPlaylist === 'true');
      }
    } else {
      context = PANEL_RESPONSE.context_off(`<${playlist.url}|${playlist.name}>`, backToPlaylist === 'true');
    }

    if (!status.is_playing) {
      context = PANEL_RESPONSE.paused;
    }
  }

  if (context) {
    currentPanel.push(contextSection(null, context));
  }

  return {altText, currentPanel};
};


/**
 * Returns a set of buttons for Slack
 * @return {Object} Slack Button Controls
 */
function getControlsPanel() {
  const overflowOptions = [
    overflowOption(`:put_litter_in_its_place: Reset playlist`, CONTROLS.reset),
    overflowOption(`:put_litter_in_its_place: Clear Songs > 1 Day Old`, CONTROLS.clear_one),
    overflowOption(`:leftwards_arrow_with_hook: Jump to Start of Playlist`, CONTROLS.jump_to_start),
    overflowOption(`:twisted_rightwards_arrows: Toggle Shuffle`, CONTROLS.shuffle),
    overflowOption(`:repeat: Toggle Repeat`, CONTROLS.repeat),
  ];
  const elements = [
    buttonActionElement(CONTROLS.play, `:arrow_forward: Play`, CONTROLS.play),
    buttonActionElement(CONTROLS.pause, `:double_vertical_bar: Pause`, CONTROLS.pause, confirmObject('Are you sure?', 'This will pause playback of Spotbot.', 'Do it', 'Cancel')),
    buttonActionElement(CONTROLS.skip, `:black_right_pointing_double_triangle_with_vertical_bar: Skip`, CONTROLS.skip),
    overflowActionElement(CONTROLLER_OVERFLOW, overflowOptions, confirmObject('Are you sure?', 'Make sure everyone is okay with you doing this.', 'Do it', 'Cancel')),
  ];
  return actionSection(CONTROLLER, elements);
}

/**
 * Returns the Shuffle/Repeat Panel
 * @param {Object} status
 * @return {Object} Shuffle/Repeat Panel
 */
function getShuffleRepeatPanel(status) {
  let warning = `:warning:`; // Shuffle/Repeat States
  // Check if Shuffle/Repeat are enabled
  if (status.shuffle_state) {
    warning += PANEL_RESPONSE.shuffle;
  }
  if (status.repeat_state && status.repeat_state != `off`) {
    warning += PANEL_RESPONSE.repeat;
  }
  if (warning.includes(PANEL_RESPONSE.shuffle) || warning.includes(PANEL_RESPONSE.repeat)) {
    return contextSection(null, warning);
  }
  return null;
}

/**
 * Update the control panel
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {Object} settings
 * @param {string} timestamp
 * @param {string} response
 * @param {Object} status
 */
async function updatePanel(teamId, channelId, auth, settings, timestamp, response, status) {
  try {
    if (!status) {
      status = await fetchCurrentPlayback(teamId, channelId, auth );
    }
    const {altText, currentPanel} = await getCurrentTrackPanel(teamId, channelId, settings, status, response);

    const controlPanel = [
      ...currentPanel,
      ...getShuffleRepeatPanel(status) ? [getShuffleRepeatPanel(status)] : [],
      getControlsPanel(),
    ];
    if (timestamp) {
      await updateChat(
          messageUpdate(channelId, timestamp, altText, controlPanel),
      );
    } else {
      await post(
          inChannelPost(channelId, altText, controlPanel),
      );
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
}


module.exports = {
  getCurrentTrackPanel,
  getControlsPanel,
  getShuffleRepeatPanel,
  PANEL_RESPONSE,
  responseUpdate,
  updatePanel,
};
