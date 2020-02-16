const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();
const logger = require(process.env.LOGGER);
const {storeDefaultDevice, storePlaylist} = require('/opt/settings/settings-interface');
const {storeTokens} = require('/opt/spotify/spotify-auth/spotify-auth-dal');

/**
 * Resets the authentication for our Spotbot channel
 * @param {Object} event
 * @param {Object} context
 */
module.exports.handler = async (event, context) => {
  try {
    const {teamId, channelId, triggerId, viewId} = JSON.parse(event.Records[0].Sns.Message);
    const params = {
      Message: JSON.stringify({teamId, channelId, triggerId, viewId}),
      TopicArn: process.env.SETTINGS_AUTH_UPDATE_VIEW,
    };
    await Promise.all([
      storeTokens(teamId, channelId, null, null),
      storeDefaultDevice(teamId, channelId, null),
      storePlaylist(teamId, channelId, null),
      // Update View of Modal
      sns.publish(params).promise(),
    ]);
  } catch (error) {
    logger.error('Change Authentication Failed');
    logger.error(error);
  }
};
