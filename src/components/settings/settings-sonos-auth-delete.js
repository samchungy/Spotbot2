const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);

const sns = require('/opt/sns');

const {changeSettings} = require('/opt/db/settings-interface');
const {removeAuth} = require('/opt/db/spotify-auth-interface');

const SETTINGS_AUTH_UPDATE_VIEW = process.env.SNS_PREFIX + 'settings-auth-update-view';

const DEFAULT_DEVICE = config.dynamodb.settings.default_device;
const PLAYLIST = config.dynamodb.settings.playlist;

/**
 * Resets the authentication for our Spotbot channel
 * @param {Object} event
 * @param {Object} context
 */
module.exports.handler = async (event, context) => {
  try {
    const {teamId, channelId, viewId, url} = JSON.parse(event.Records[0].Sns.Message);
    await Promise.all([
      removeAuth(teamId, channelId),
      changeSettings(teamId, channelId, [
        {key: DEFAULT_DEVICE, value: null},
        {key: PLAYLIST, value: null},
      ]),
    ]);
    const params = {
      Message: JSON.stringify({teamId, channelId, viewId, url}),
      TopicArn: SETTINGS_AUTH_UPDATE_VIEW,
    };
    // Update View of Modal
    await sns.publish(params).promise();
  } catch (error) {
    logger.error('Change Authentication Failed');
    logger.error(error);
  }
};
