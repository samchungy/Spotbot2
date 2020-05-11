const sns = require('/opt/sns');


const {checkIsSetup} = require('/opt/check-settings');
const slackAuthorized = require('/opt/authorizer');
const DELETE_CHANNEL = process.env.SNS_PREFIX + 'delete-channel';

const logger = require(process.env.LOGGER);

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
    const payload = JSON.parse(event.body);
    switch (payload.type) {
      case 'url_verification':
        body = payload.challenge;
        break;
      case 'event_callback':
        if (payload.event && ['group_left', 'channel_left'].includes(payload.event.type)) {
          const settings = await checkIsSetup(payload.team_id, payload.event.channel);
          params = {
            Message: JSON.stringify({teamId: payload.team_id, channelId: payload.event.channel, settings}),
            TopicArn: DELETE_CHANNEL,
          };
          await sns.publish(params).promise();
          break;
        }
    }
  } catch (error) {
    logger.error('Slack event router failed');
    logger.error(error);
    body = ':warning: An error occured. Please try again.';
  }
  return {
    statusCode,
    body,
  };
};
