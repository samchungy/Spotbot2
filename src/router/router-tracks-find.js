'use strict';
const qs = require('qs');
const sns = require('/opt/sns');
const logger = require('/opt/utils/util-logger');
const config = require('/opt/config/config');

// Slack
const slackAuthorized = require('/opt/router/authorizer');
const {publicAck} = require('/opt/router/slack-reply');
// Settings
const {checkIsSetup} = require('/opt/router/check-settings');
// Errors
const {SetupError} = require('/opt/errors/errors-settings');

const TRACKS_FIND_SEARCH = process.env.SNS_PREFIX + 'tracks-find-search';
const GHOST_MODE = config.dynamodb.settings.ghost_mode;

const router = async (event, context) => {
  const payload = qs.parse(event.body);
  const settings = await checkIsSetup(payload.team_id, payload.channel_id);
  const params = {
    Message: JSON.stringify({
      teamId: payload.team_id,
      channelId: payload.channel_id,
      settings,
      query: payload.text,
      userId: payload.user_id,
      triggerId: payload.trigger_id,
    }),
    TopicArn: TRACKS_FIND_SEARCH,
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
        logger.error(error, 'Uncategorized Error in the Find Track Router');
        return {statusCode: 200, body: ':warning: An error occured. Please try again.'};
      });
};
