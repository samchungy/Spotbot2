const logger = require('../../../layers/config/util-logger');
const {loadAdmins, loadPlaylist} = require('./settings-interface');
const {post, reply} = require('../slack/slack-api');
const {ephemeralReply, ephemeralPost} = require('../slack/format/slack-format-reply');
const MIDDLEWARE_RESPONSE = {
  admin_error: ':information_source: You must be a Spotbot admin for this channel to use this command.',
  settings_error: ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.',
};

/**
 * Determine if Spotbot settings are set
 * @param {string} teamId
 * @param {string} channelId
 */
async function isSetup(teamId, channelId) {
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

/**
 * Koa middleware for check settings
 * @param {Object} ctx
 * @param {Function} next
 */
async function checkSettingsMiddleware(ctx, next) {
  const payload = ctx.request.body;
  if (await checkSettings(payload.team_id, payload.channel_id, payload.response_url)) {
    await next();
  } else {
    ctx.body = '';
  }
}

module.exports = {
  checkIsAdmin,
  checkSettingsMiddleware,
  checkSettings,
  isSetup,
};
