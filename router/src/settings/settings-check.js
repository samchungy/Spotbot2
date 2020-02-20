const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {loadSettings} = require('/opt/settings/settings-interface');
const {postEphemeral, reply} = require('/opt/slack/slack-api');
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
    const settings = await loadSettings(teamId, channelId, [PLAYLIST]);
    return (settings && settings[PLAYLIST]);
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
    if (!await checkIsSetup(teamId, channelId)) {
      await postEphemeral(
          ephemeralPost(channelId, userId, MIDDLEWARE_RESPONSE.settings_error, null),
      );
      return false;
    };
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Checks if settings are set. (Koa Middleware)
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 */
async function checkIsAdmin(teamId, channelId, userId) {
  try {
    const settings = await loadSettings(teamId, channelId, [CHANNEL_ADMINS]);
    if (settings && settings[CHANNEL_ADMINS].includes(userId)) {
      return true;
    };
    await reply(
        postEphemeral(channelId, userId, MIDDLEWARE_RESPONSE.admin_error, null),
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
