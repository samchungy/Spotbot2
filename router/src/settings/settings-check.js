const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {loadSettings} = require('/opt/settings/settings-interface');
const {postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');

const PLAYLIST = config.dynamodb.settings.playlist;
const CHANNEL_ADMINS = config.dynamodb.settings.channel_admins;

const MIDDLEWARE_RESPONSE = {
  admin_error: ':information_source: You must be a Spotbot admin for this channel to use this command.',
  settings_error: ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.',
};

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
 * Checks if settings are set.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 */
async function checkSettings(teamId, channelId, userId) {
  try {
    const settings = await checkIsSetup(teamId, channelId);
    if (!settings) {
      await postEphemeral(
          ephemeralPost(channelId, userId, MIDDLEWARE_RESPONSE.settings_error, null),
      );
      return false;
    };
    return settings;
  } catch (error) {
    throw error;
  }
}

/**
 * Checks if settings are set. (Koa Middleware)
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} settings
 * @param {string} userId
 */
async function checkIsAdmin(teamId, channelId, settings, userId) {
  try {
    if (settings && settings[CHANNEL_ADMINS] && settings[CHANNEL_ADMINS].includes(userId)) {
      return settings;
    };
    await postEphemeral(
        ephemeralPost(channelId, userId, MIDDLEWARE_RESPONSE.admin_error, null),
    );
    return false;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  checkIsAdmin,
  checkSettings,
  checkIsSetup,
};
