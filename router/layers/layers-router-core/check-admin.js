const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const CHANNEL_ADMINS = config.dynamodb.settings.channel_admins;

/**
 * Checks if user is an admin
 * @param {Object} settings
 * @param {string} userId
 * @return {*}
 */
function checkIsAdmin(settings, userId) {
  try {
    if (settings && settings[CHANNEL_ADMINS] && settings[CHANNEL_ADMINS].includes(userId)) {
      return true;
    };
    return settings[CHANNEL_ADMINS];
  } catch (error) {
    logger.error('Check is admin failed');
    throw error;
  }
}

module.exports = {
  checkIsAdmin,
};
