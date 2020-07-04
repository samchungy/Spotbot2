'use strict';
const qs = require('qs');
const sns = require('/opt/sns');
const logger = require('/opt/utils/util-logger');

// Slack
const slackAuthorized = require('/opt/authorizer');
const {publicAck} = require('/opt/slack-reply');
// Settings
const {checkIsSetup} = require('/opt/check-settings');
// Errors
const {SetupError} = require('/opt/errors/errors-settings');

const CONTROL_PAUSE = process.env.SNS_PREFIX + 'control-pause';

const router = async (event, context) => {
  const payload = qs.parse(event.body);
  const params = {
    Message: JSON.stringify({
      teamId: payload.team_id,
      channelId: payload.channel_id,
      settings: await checkIsSetup(payload.team_id, payload.channel_id),
      userId: payload.user_id,
    }),
    TopicArn: CONTROL_PAUSE,
  };
  await sns.publish(params).promise();
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
        logger.error(error, 'Uncategorized Error in Pause Router');
        return {statusCode: 200, body: ':warning: An error occured. Please try again.'};
      });
};
