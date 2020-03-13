'use strict';
const qs = require('qs');
const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();
const logger = require(process.env.LOGGER);

const slackAuthorized = require('/opt/authorizer');
const {checkIsSetup} = require('/opt/check-settings');
const {publicAck} = require('/opt/slack-reply');

const CONTROL_PLAY = process.env.SNS_PREFIX + 'control-play';

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
      body = ':information_source: Spotbot is not setup in this channel. Use `/spotbot` settings to setup Spotbot.';
      return {
        statusCode,
        body,
      };
    }
    const params = {
      Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, timestamp: null, userId: payload.user_id}),
      TopicArn: CONTROL_PLAY,
    };
    await sns.publish(params).promise();
    body = JSON.stringify(publicAck(''));
  } catch (error) {
    logger.error('Play control router failed');
    logger.error(error);
    body = ':warning: An error occured. Please try again.';
  }
  return {
    statusCode,
    body,
  };
};
