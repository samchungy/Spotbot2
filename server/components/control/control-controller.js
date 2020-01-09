const logger = require('../../util/util-logger');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {getCurrentTrackPanel, getShuffleRepeatPanel, getControlsPanel} = require('./control-panel');
const {inChannelReply, updateReply, inChannelPost} = require('../slack/format/slack-format-reply');
const {post, reply} = require('../slack/slack-api');
const {setPlay} = require('./control-play');
const {setPause} = require('./control-pause');

/**
 * Opens a menu of Spotbot controls
 * @param {string} responseUrl
 */
async function openControls(responseUrl) {
  try {
    try {
      const status = await fetchCurrentPlayback();
      const {altText, currentPanel} = getCurrentTrackPanel(status);

      const controlPanel = [
        ...currentPanel,
        ...getShuffleRepeatPanel(status) ? [getShuffleRepeatPanel(status)] : [],
        getControlsPanel(),
      ];

      await reply(
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
 * Update the control panel
 * @param {string} responseUrl
 * @param {string} response
 * @param {Object} status
 */
async function updatePanel(responseUrl, response, status) {
  try {
    if (!status) {
      status = await fetchCurrentPlayback();
    }
    const {altText, currentPanel} = getCurrentTrackPanel(status, response);

    const controlPanel = [
      ...currentPanel,
      ...getShuffleRepeatPanel(status) ? [getShuffleRepeatPanel(status)] : [],
      getControlsPanel(),
    ];

    await reply(
        updateReply(altText, controlPanel),
        responseUrl,
    );
  } catch (error) {
    logger.error(error);
      }
    }

/**
 * Hits Play on Spotify
 * @param {string} responseUrl
 * @param {string} channelId
 */
async function play(responseUrl, channelId) {
  try {
    const {success, response, status} = await setPlay();
    if (!success) {
      await updatePanel(responseUrl, response, status);
  } else {
      await updatePanel(responseUrl, null, status);
      await post(
          inChannelPost(channelId, response, null),
      );
  }
  } catch (error) {
    logger.error(error);
}
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
