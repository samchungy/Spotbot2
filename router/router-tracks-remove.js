const qs = require('qs');
const sns = require('/opt/sns');

const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);

const EMPTY_MODAL = config.slack.actions.empty_modal;
const slackAuthorized = require('/opt/authorizer');
const {openModal} = require('/opt/slack-modal');
const {checkIsSetup} = require('/opt/check-settings');
const {publicAck} = require('/opt/slack-reply');

const TRACKS_REMOVE_OPEN = process.env.SNS_PREFIX + 'tracks-remove-open';

module.exports.handler = async (event, context) => {
  let statusCode = 200; let body = '';
  try {
    if (!slackAuthorized(event)) {
      statusCode = 401;
      body = 'Unauathorized';
      return {
        statusCode,
        body,
      };
    }
    const payload = qs.parse(event.body);
    const settings = await checkIsSetup(payload.team_id, payload.channel_id);
    if (!settings) {
      body = ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.';
      return {
        statusCode,
        body,
      };
    }
    const removePayload = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Remove Tracks', null, 'Cancel');
    const params = {
      Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings: settings, viewId: removePayload.view.id, userId: payload.user_id}),
      TopicArn: TRACKS_REMOVE_OPEN,
    };
    await sns.publish(params).promise();
    body = JSON.stringify(publicAck(''));
  } catch (error) {
    logger.error('Remove track router failed');
    logger.error(error);
    body = ':warning: An error occured. Please try again.';
  }
  return {
    statusCode,
    body,
  };
};
