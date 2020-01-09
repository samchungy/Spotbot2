const config = require('config');
const {loadPlaylistSetting} = require('../settings/settings-dal');
const Track = require('../../util/util-spotify-track');
const CONTEXT_RESPONSES = config.get('slack.responses.playback.context');
const {actionSection, buttonActionElement, contextSection, imageSection, overflowActionElement, overflowOption, textSection} = require('../slack/format/slack-format-blocks');
const CONTROLLER = config.get('slack.actions.controller');
const CONTROLLER_OVERFLOW = config.get('slack.actions.controller_overflow');
const CONTROLS = config.get('slack.actions.controls');
const PLAY_RESPONSES = config.get('slack.responses.playback.play');
const currentlyPlayingTextMrkdwn = (title, url, artist, album) => `*Currently Playing...*\n<${url}|*${title}*>\n:studio_microphone: *Artist:* ${artist}\n:dvd: *Album*: ${album}\n`;
const currentlyPlayingText = (title, artist, album) => `Currently Playing... ${title}\n:studio_microphone: Artist: ${artist}\nAlbum: ${album}\n`;


/**
 * Get Current Track Panel
 * @param {Object} status
 * @param {string} response
 * @return {Object} Control Panel Block
 */
function getCurrentTrackPanel(status, response) {
  // If we have a song playing push the currently playing stack on
  let altText; let context;
  const currentPanel = [];
  if (status.item) {
    const track = new Track(status.item);
    context = CONTEXT_RESPONSES.not_on_playlist;
    const text = currentlyPlayingTextMrkdwn(track.name, track.url, track.artists, track.album);
    altText = currentlyPlayingText(track.name, track.artists, track.album);
    // Check if we are playing from the playlist
    if (status.context) {
      const playlist = loadPlaylistSetting();
      if (status.context.uri.includes(playlist.id)) {
        context = CONTEXT_RESPONSES.on_playlist;
      }
    }

    if (!status.is_playing) {
      context = CONTEXT_RESPONSES.paused;
    }

    currentPanel.push(
        imageSection(text, track.art, `Album Art`),
    );
  } else {
    // Not Playing
    altText = PLAY_RESPONSES.not_playing;
    currentPanel.push(
        textSection(PLAY_RESPONSES.not_playing),
    );
  }

  if (response) {
    context = response;
  }

  if (context) {
    currentPanel.push(contextSection(null, context));
  }

  return {altText, currentPanel};
}


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
    buttonActionElement(`:arrow_forward: Play`, CONTROLS.play),
    buttonActionElement(`:double_vertical_bar: Pause`, CONTROLS.pause),
    buttonActionElement(`:black_right_pointing_double_triangle_with_vertical_bar: Skip`, CONTROLS.skip),
    overflowActionElement(CONTROLLER_OVERFLOW, overflowOptions),
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
    warning += CONTEXT_RESPONSES.shuffle;
  }
  if (status.repeat_state && status.repeat_state != `off`) {
    warning += CONTEXT_RESPONSES.repeat;
  }
  if (warning.includes(CONTEXT_RESPONSES.shuffle) || warning.includes(CONTEXT_RESPONSES.repeat)) {
    return contextSection(null, warning);
  }
  return null;
}


module.exports = {
  getCurrentTrackPanel,
  getControlsPanel,
  getShuffleRepeatPanel,
};
