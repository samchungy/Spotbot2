const qs = require('qs');
const sns = require('/opt/sns');

const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const slackAuthorized = require('/opt/authorizer');
const {checkIsSetup} = require('/opt/check-settings');
const {publicAck} = require('/opt/slack-reply');

const TRACKS_FIND_ARTISTS_SEARCH = process.env.SNS_PREFIX + 'tracks-find-artists-search';
const GHOST_MODE = config.dynamodb.settings.ghost_mode;

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
      Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, query: payload.text, userId: payload.user_id, triggerId: payload.trigger_id}),
      TopicArn: TRACKS_FIND_ARTISTS_SEARCH,
    };
    await sns.publish(params).promise();
    if (!(settings[GHOST_MODE] == 'true')) {
      body = JSON.stringify(publicAck(''));
    }
  } catch (error) {
    logger.error('Find artists router failed');
    logger.error(error);
    body = ':warning: An error occured. Please try again.';
  }
  return {
    statusCode,
    body,
  };
};
