const logger = require('/opt/utils/util-logger');
const config = require('/opt/config/config');

// Slack
const {actionSection, buttonActionElement, confirmObject, overflowActionElement, overflowOption, textSection} = require('/opt/slack/format/slack-format-blocks');
const {post} = require('/opt/slack/slack-api');
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const CONTROLLER = config.slack.actions.controller;
const CONTROLLER_OVERFLOW = config.slack.actions.controller_overflow;
const CONTROLS = config.slack.actions.controls;

const RESPONSE = {
  info: ':level_slider: Control panel: Select an action to perform',
  failed: 'Opening control panel failed',
};

const BUTTONS = {
  reset: `:put_litter_in_its_place: Reset playlist`,
  clear: `:put_litter_in_its_place: Clear Songs > 1 Day Old`,
  jump: `:leftwards_arrow_with_hook: Jump to Start of Playlist`,
  shuffle: `:twisted_rightwards_arrows: Toggle Shuffle`,
  repeat: `:repeat: Toggle Repeat`,
  play: `:arrow_forward: Play`,
  pause: `:double_vertical_bar: Pause`,
  skip: `:black_right_pointing_double_triangle_with_vertical_bar: Skip`,
};

/**
 * Returns a set of buttons for Slack
 * @return {Object} Slack Button Controls
 */
const getControlsPanel = () => {
  const overflowOptions = [
    overflowOption(BUTTONS.reset, CONTROLS.reset),
    overflowOption(BUTTONS.clear, CONTROLS.clear_one),
    overflowOption(BUTTONS.jump, CONTROLS.jump_to_start),
    overflowOption(BUTTONS.shuffle, CONTROLS.shuffle),
    overflowOption(BUTTONS.repeat, CONTROLS.repeat),
  ];
  const elements = [
    buttonActionElement(CONTROLS.play, BUTTONS.play, CONTROLS.play),
    buttonActionElement(CONTROLS.pause, BUTTONS.pause, CONTROLS.pause, confirmObject('Are you sure?', 'This will pause playback of Spotbot.', 'Do it', 'Cancel')),
    buttonActionElement(CONTROLS.skip, BUTTONS.skip, CONTROLS.skip),
    overflowActionElement(CONTROLLER_OVERFLOW, overflowOptions, confirmObject('Are you sure?', 'Make sure everyone is okay with you doing this.', 'Do it', 'Cancel')),
  ];
  return actionSection(CONTROLLER, elements);
};

const main = async (channelId) => {
  const blocks = [
    textSection(RESPONSE.info),
    getControlsPanel(),
  ];
  const message = inChannelPost(channelId, RESPONSE.info, blocks);
  await post(message);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId} = JSON.parse(event.Records[0].Sns.Message);
  await main(channelId)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
module.exports.BUTTONS = BUTTONS;
