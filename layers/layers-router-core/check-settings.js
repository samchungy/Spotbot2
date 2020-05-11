const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {loadSettings} = require('/opt/settings/settings-interface');

const PLAYLIST = config.dynamodb.settings.playlist;

/**
 * Determine if Spotbot settings are set
 * @param {string} teamId
 * @param {string} channelId
 */
async function checkIsSetup(teamId, channelId) {
  try {
    const settings = await loadSettings(teamId, channelId);
    if (settings && settings[PLAYLIST]) {
      return settings;
    } else {
      return false;
    };
  } catch (error) {
    logger.error(error);
    return false;
  }
}

module.exports = {
  checkIsSetup,
};
