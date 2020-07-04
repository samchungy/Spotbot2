const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);

// Slack
const {actionSection, buttonActionElement, confirmObject, overflowActionElement, overflowOption, textSection} = require('/opt/slack/format/slack-format-blocks');
const {post} = require('/opt/slack/slack-api');
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const CONTROLLER = config.slack.actions.controller;
const CONTROLLER_OVERFLOW = config.slack.actions.controller_overflow;
const CONTROLS = config.slack.actions.controls;

const CONTROL_RESPONSE = {
  info: ':level_slider: Control panel: Select an action to perform',
  failed: 'Opening control panel failed',
};

/**
 * Returns a set of buttons for Slack
 * @return {Object} Slack Button Controls
 */
const getControlsPanel = () => {
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
};

const openControls = async (channelId) => {
  const blocks = [
    textSection(CONTROL_RESPONSE.info),
    getControlsPanel(),
  ];
  const message = inChannelPost(channelId, CONTROL_RESPONSE.info, blocks);
  return post(message);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId} = JSON.parse(event.Records[0].Sns.Message);
  await openControls(channelId)
      .catch((error)=>{
        logger.error(error, CONTROL_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, CONTROL_RESPONSE.failed);
      });
};
