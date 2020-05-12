'use strict';
const qs = require('qs');
const sns = require('/opt/sns');

const logger = require(process.env.LOGGER);

const slackAuthorized = require('/opt/authorizer');
const {checkIsSetup} = require('/opt/check-settings');
const {publicAck} = require('/opt/slack-reply');

const CONTROL_SKIP_START = process.env.SNS_PREFIX + 'control-skip-start';

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
    const {settings} = await checkIsSetup(payload.team_id, payload.channel_id);
    if (!settings) {
      body = ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.';
      return {
        statusCode,
        body,
      };
    }
    const params = {
      Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, timestamp: null, userId: payload.user_id}),
      TopicArn: CONTROL_SKIP_START,
    };
    await sns.publish(params).promise();
    body = JSON.stringify(publicAck(''));
  } catch (error) {
    logger.error('Skip control router failed');
    logger.error(error);
    body = ':warning: An error occured. Please try again.';
  }
  return {
    statusCode,
    body,
  };
};
