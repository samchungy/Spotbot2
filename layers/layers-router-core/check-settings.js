const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {loadSettings} = require('/opt/db/settings-interface');

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
      return {settings, isSetup: true};
    } else {
      return {settings, isSetup: false};
    };
  } catch (error) {
    logger.error(error);
    return {settings: null, isSetup: false};
  }
}

module.exports = {
  checkIsSetup,
};
