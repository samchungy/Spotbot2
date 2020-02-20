const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);

const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();
const {changeSettings} = require('/opt/settings/settings-interface');
const {removeSpotifyAuth} = require('/opt/spotify/spotify-auth/spotify-auth-interface');

const DEFAULT_DEVICE = config.dynamodb.settings.default_device;
const PLAYLIST = config.dynamodb.settings.playlist;

/**
 * Resets the authentication for our Spotbot channel
 * @param {Object} event
 * @param {Object} context
 */
module.exports.handler = async (event, context) => {
  try {
    const {teamId, channelId, viewId} = JSON.parse(event.Records[0].Sns.Message);
    await Promise.all([
      removeSpotifyAuth(teamId, channelId),
      changeSettings(teamId, channelId, [
        {key: DEFAULT_DEVICE, value: null},
        {key: PLAYLIST, value: null},
      ]),
    ]);
    const params = {
      Message: JSON.stringify({teamId, channelId, viewId}),
      TopicArn: process.env.SETTINGS_AUTH_UPDATE_VIEW,
    };
    // Update View of Modal
    await sns.publish(params).promise();
  } catch (error) {
    logger.error('Change Authentication Failed');
    logger.error(error);
  }
};
