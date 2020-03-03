const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {loadSettings} = require('/opt/settings/settings-interface');
const {getConversationInfo} = require('/opt/slack/slack-api');

const PLAYLIST = config.dynamodb.settings.playlist;
const CHANNEL_ADMINS = config.dynamodb.settings.channel_admins;

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

/**
 * Determine if Spotbot is in channel
 * @param {string} channelId
 * @param {string} responseUrl
 */
async function checkIsInChannel(channelId, responseUrl) {
  try {
    const info = await getConversationInfo(channelId);
    if (info.ok && info.channel && info.channel.is_member) {
      return true;
    }
  } catch (error) {
    logger.error(error);
  }
  return false;
}

/**
 * Checks if settings are set.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} responseUrl
 */
async function checkSettings(teamId, channelId) {
  try {
    const settings = await checkIsSetup(teamId, channelId);
    if (!settings) {
      return false;
    }
    return settings;
  } catch (error) {
    throw error;
  }
}

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
    throw error;
  }
}

module.exports = {
  checkIsInChannel,
  checkIsAdmin,
  checkSettings,
  checkIsSetup,
};
