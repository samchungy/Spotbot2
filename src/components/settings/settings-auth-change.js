const logger = require('/opt/utils/util-logger');
const sns = require('/opt/sns');

// Spotify
const {invalidateAuth} = require('/opt/spotify/spotify-api/spotify-api-refresh');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Config
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
  const {teamId, channelId, userId, viewId, url} = JSON.parse(event.Records[0].Sns.Message);
  await changeAuth(teamId, channelId, viewId, url)
      .catch((error)=>{
        logger.error(error, CHANGE_AUTH.failed);
        reportErrorToSlack(teamId, channelId, userId, CHANGE_AUTH.failed);
      });
};

