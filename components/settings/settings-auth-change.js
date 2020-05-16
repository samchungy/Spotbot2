const logger = require(process.env.LOGGER);

const sns = require('/opt/sns');
const {invalidateAuth} = require('/opt/spotify/spotify-api/spotify-api-refresh');

const SETTINGS_AUTH_UPDATE_VIEW = process.env.SNS_PREFIX + 'settings-auth-update-view';

const CHANGE_AUTH = {
  failed: 'Auth change failed',
};

const changeAuth = async (teamId, channelId, viewId, url) => {
  await invalidateAuth(teamId, channelId);
  const params = {
    Message: JSON.stringify({teamId, channelId, viewId, url}),
    TopicArn: SETTINGS_AUTH_UPDATE_VIEW,
  };
  // Update View of Modal
  await sns.publish(params).promise();
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, viewId, url} = JSON.parse(event.Records[0].Sns.Message);
  await changeAuth(teamId, channelId, viewId, url)
      .catch((err)=>{
        logger.error(err);
        logger.error(CHANGE_AUTH.failed);
        reportErrorToSlack(teamId, channelId, userId, CHANGE_AUTH.failed);
      });
};

