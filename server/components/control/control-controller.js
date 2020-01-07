const config = require('config');
const logger = require('../../util/util-logger');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {actionSection, buttonActionElement, contextSection, imageSection, overflowActionElement, overflowOption} = require('../slack/format/slack-format-blocks');
const {ephemeralReply, inChannelReply} = require('../slack/format/slack-format-reply');
const {loadPlaylistSetting} = require('../settings/settings-dal');
const {reply} = require('../slack/slack-api');
const Track = require('../../util/util-spotify-track');

const CONTROLLER = config.get('slack.actions.controller');
const CONTROLLER_OVERFLOW = config.get('slack.actions.controller_overflow');
const CONTROLS = config.get('slack.actions.controls');
const currentlyPlayingTextMrkdwn = (title, url, artist, album) => `*Currently Playing*:\n<${url}|*${title}*>\n:studio_microphone: *Artist:* ${artist}\n:dvd: *Album*: ${album}\n`;
const currentlyPlayingText = (title, artist, album) => `Currently Playing: ${title}\n:studio_microphone: Artist: ${artist}\nAlbum: ${album}\n`;
const contextOnPlaylist = `:information_source: Currently playing from the Spotbot playlist.`;
const contextOffPlaylist = `:information_source: Not currently playing from the Spotbot playlist.`;
const shuffleWarning = ` Shuffle is *enabled*.`;
const repeatWarning = ` Repeat is *enabled*.`;
const spotifyNotPlaying = `:information_source: Spotify is currently not playing.`;

/**
 * Opens a menu of Spotbot controls
 * @param {string} responseUrl
 */
async function openControls(responseUrl) {
  try {
    try {
      // TODO Get Currently Playing Status from Spotify
      const status = await fetchCurrentPlayback();
      let warning = `:warning:`; // Shuffle/Repeat States
      const {altText, controlPanel} = getCurrentTrack(status);

      // Check if Shuffle/Repeat are enabled
      if (status.shuffle_state) {
        warning += shuffleWarning;
      }
      if (status.repeat_state && status.repeat_state != `off`) {
        warning += repeatWarning;
      }
      if (warning.includes(shuffleWarning) || warning.includes(repeatWarning)) {
        controlPanel.push(
            contextSection(null, warning),
        );
      }

      controlPanel.push(
          getControls(),
      );

      reply(
          inChannelReply(altText, controlPanel),
          responseUrl,
      );
    } catch (error) {
      console.error(error);
      logger.error('Yeet');
    }
  } catch (error) {
    logger.error('Failed to report failiure to Slack');
  }
}

/**
 * Get Current Track Panel
 * @param {Object} status
 * @return {Object} Control Panel Block
 */
function getCurrentTrack(status) {
  // If we have a song playing push the currently playing stack on
  let text; let altText;
  const controlPanel = [];
  if (status.item) {
    const track = new Track(status.item);
    let context = contextOffPlaylist;
    text = currentlyPlayingTextMrkdwn(track.name, track.url, track.artists, track.album);
    altText = currentlyPlayingText(track.name, track.artists, track.album);

    // Check if we are playing from the playlist
    if (status.context) {
      const playlist = loadPlaylistSetting();
      if (status.context.uri.includes(playlist.id)) {
        context = contextOnPlaylist;
      }
    }
    controlPanel.push(
        imageSection(text, track.art, `Album Art`),
        contextSection(null, context),
    );
  } else {
    // Not Playing
    altText = spotifyNotPlaying;
  }
  return {altText, controlPanel};
}

/**
 * Returns a set of buttons for Slack
 * @return {Object} Slack Button Controls
 */
function getControls() {
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

// {
//   "blocks": [{
//       "type": "section",
//       "text": {
//         "type": "mrkdwn",
//         "text": "_Currently Playing_:\n<http://www.foo.com|*Magnolia*> \n *Artist:* Gang of Youths\n *Album*: Yadyadayada\n"
//       },
//       "accessory": {
//         "type": "image",
//         "image_url": "https://api.slack.com/img/blocks/bkb_template_images/plants.png",
//         "alt_text": "plants"
//       }
//     },
//     {
//       "type": "context",
//       "elements": [{
//         "type": "mrkdwn",
//         "text": ":information_source: Currently at song 7/20 on the Spotbot Playlist"
//       }]
//     },
//     {
//       "type": "context",
//       "elements": [{
//         "type": "mrkdwn",
//         "text": ":warning: Shuffle *Enabled*, Repeat *Enabled*"
//       }]
//     },
//     {
//       "type": "actions",
//       "elements": [{
//           "type": "button",
//           "text": {
//             "type": "plain_text",
//             "emoji": true,
//             "text": ":arrow_forward: Play"
//           },
//           "value": "click_me_123"
//         },
//         {
//           "type": "button",
//           "text": {
//             "type": "plain_text",
//             "emoji": true,
//             "text": ":double_vertical_bar: Pause"
//           },
//           "value": "click_me_123"
//         },
//         {
//           "type": "button",
//           "text": {
//             "type": "plain_text",
//             "emoji": true,
//             "text": ":black_right_pointing_double_triangle_with_vertical_bar: Skip"
//           },
//           "value": "click_me_123"
//         },
//         {
//           "type": "overflow",
//           "options": [{
//               "text": {
//                 "type": "plain_text",
//                 "text": ":put_litter_in_its_place: Reset playlist"
//               },
//               "value": "value-1"
//             },
//             {
//               "text": {
//                 "type": "plain_text",
//                 "text": ":put_litter_in_its_place: Clear Songs > 1 Day Old"
//               },
//               "value": "value-1"
//             },
//             {
//               "text": {
//                 "type": "plain_text",
//                 "text": ":leftwards_arrow_with_hook: Jump to Start of Playlist"
//               },
//               "value": "value-3"
//             },
//             {
//               "text": {
//                 "type": "plain_text",
//                 "text": ":twisted_rightwards_arrows: Toggle Shuffle"
//               },
//               "value": "value-1"
//             },
//             {
//               "text": {
//                 "type": "plain_text",
//                 "text": ":repeat: Toggle Repeat"
//               },
//               "value": "value-4"
//             }
//           ],
//           "action_id": "overflow",
//           "confirm": {
//             "title": {
//               "type": "plain_text",
//               "text": "Are you sure?"
//             },
//             "text": {
//               "type": "mrkdwn",
//               "text": "Please make sure everyone is okay with you doing this."
//             },
//             "confirm": {
//               "type": "plain_text",
//               "text": "Do it"
//             },
//             "deny": {
//               "type": "plain_text",
//               "text": "Cancel"
//             }
//           }
//         }
//       ]
//     }
//   ]
// }

module.exports = {
  openControls,
};
