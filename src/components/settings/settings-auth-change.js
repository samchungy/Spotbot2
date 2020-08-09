const logger = require('/opt/utils/util-logger');
const sns = require('/opt/sns');

// Spotify
const {invalidateAuth} = require('/opt/spotify/spotify-auth/spotify-auth-refresh');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Config
const SETTINGS_AUTH_UPDATE_VIEW = process.env.SNS_PREFIX + 'settings-auth-update-view';
const RESPONSE = {
  failed: 'Auth change failed',
};

const main = async (teamId, channelId, viewId, url) => {
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
  await main(teamId, channelId, viewId, url)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, RESPONSE.failed);
      });
};

module.exports.RESPONSE = RESPONSE;
module.exports.SETTINGS_AUTH_UPDATE_VIEW = SETTINGS_AUTH_UPDATE_VIEW;
