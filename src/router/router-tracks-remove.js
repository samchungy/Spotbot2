'use strict';
const config = require('/opt/config/config');
const qs = require('qs');
const sns = require('/opt/sns');
const logger = require('/opt/utils/util-logger');

// Slack
const {openModal} = require('/opt/slack-modal');
const slackAuthorized = require('/opt/authorizer');
const {publicAck} = require('/opt/slack-reply');
// Settings
const {checkIsSetup} = require('/opt/check-settings');
// Errors
const {SetupError} = require('/opt/errors/errors-settings');

const EMPTY_MODAL = config.slack.actions.empty_modal;
const GHOST_MODE = config.dynamodb.settings.ghost_mode;
const TRACKS_REMOVE_OPEN = process.env.SNS_PREFIX + 'tracks-remove-open';

const router = async (event, context) => {
  const payload = qs.parse(event.body);
  const removePayload = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Remove Tracks', null, 'Cancel');
  const settings = await checkIsSetup(payload.team_id, payload.channel_id);

  const params = {
    Message: JSON.stringify({
      teamId: payload.team_id,
      channelId: payload.channel_id,
      viewId: removePayload.view.id,
      userId: payload.user_id,
      settings,
    }),
    TopicArn: TRACKS_REMOVE_OPEN,
  };
  await sns.publish(params).promise();
  if (settings[GHOST_MODE] === 'true') {
    return '';
  }
  return JSON.stringify(publicAck(''));
};

module.exports.handler = async (event, context) => {
  if (!slackAuthorized(event)) {
    return {statusCode: 401, body: 'Unauathorized'};
  }
  return await router(event, context)
      .then((data) => ({statusCode: 200, body: data ? data: ''}))
      .catch((error) => {
        if (error instanceof SetupError) {
          return {statusCode: 200, body: error.message};
        }
        logger.error(error, 'Uncategorized Error in the remove track Router');
        return {statusCode: 200, body: ':warning: An error occured. Please try again.'};
      });
};
