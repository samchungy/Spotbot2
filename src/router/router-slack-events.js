const sns = require('/opt/sns');
const logger = require('/opt/utils/util-logger');

const {SetupError} = require('/opt/errors/errors-settings');
const {checkIsPreviouslySetup} = require('/opt/router/check-settings');
const slackAuthorized = require('/opt/router/authorizer');

const DELETE_CHANNEL = process.env.SNS_PREFIX + 'delete-channel';

const router = async (event, context) => {
  const eventPayload = event.body;
  if (eventPayload) {
    const payload = JSON.parse(eventPayload);
    switch (payload.type) {
      case 'url_verification': {
        return payload.challenge;
      }
      case 'event_callback': {
        if (payload.event && ['group_left', 'channel_left'].includes(payload.event.type)) {
          await checkIsPreviouslySetup(payload.team_id, payload.event.channel);
          const params = {
            Message: JSON.stringify({
              teamId: payload.team_id,
              channelId: payload.event.channel,
            }),
            TopicArn: DELETE_CHANNEL,
          };
          await sns.publish(params).promise();
          return;
        }
      }
    }
  }
};

module.exports.handler = async (event, context) => {
  if (!slackAuthorized(event)) {
    return {statusCode: 401, body: 'Unauathorized'};
  }
  return await router(event, context)
      .then((data) => ({statusCode: 200, body: data ? data : ''}))
      .catch((error) => {
        if (error instanceof SetupError) {
          return {statusCode: 200, body: error.message};
        }
        logger.error(error, 'Uncategorized Error in Slack Events Router');
      });
};
