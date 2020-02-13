const logger = require(process.env.CONFIG);
const {loadAdmins, loadPlaylist} = require('/opt/settings/settings-interface');
const {post, reply} = require('/opt/slack/slack-api');
const {ephemeralReply, ephemeralPost} = require('/opt/slack/format/slack-format-reply');
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
    return await loadPlaylist(teamId, channelId) ? true : false;
  } catch (error) {
    logger.error(error);
    return false;
  }
}

/**
 * Checks if settings are set. (Koa Middleware)
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} responseUrl
 * @param {string} userId
 */
async function checkSettings(teamId, channelId, responseUrl, userId) {
  try {
    if (!await isSetup(teamId, channelId)) {
      if (userId) {
        post(
            ephemeralPost(channelId, userId, MIDDLEWARE_RESPONSE.settings_error, null),
        );
      } else {
        await reply(
            ephemeralReply(MIDDLEWARE_RESPONSE.settings_error, null),
            responseUrl,
        );
      }

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
 * @param {string} responseUrl
 */
async function checkIsAdmin(teamId, channelId, userId, responseUrl) {
  try {
    const admins = await loadAdmins(teamId, channelId);
    if (admins && admins.includes(userId)) {
      return true;
    };
    await reply(
        ephemeralReply(MIDDLEWARE_RESPONSE.admin_error, null),
        responseUrl,
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
