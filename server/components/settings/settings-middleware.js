const config = require('config');
const logger = require('../../util/util-logger');
const {loadAdmins, loadPlaylist} = require('./settings-interface');
const {post, reply} = require('../slack/slack-api');
const {ephemeralReply, ephemeralPost} = require('../slack/format/slack-format-reply');
const SETTINGS_ERROR = config.get('settings.errors.settings');
const ADMIN_ERROR = config.get('settings.errors.not_admin');

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
            ephemeralPost(channelId, userId, SETTINGS_ERROR, null),
        );
      } else {
        await reply(
            ephemeralReply(SETTINGS_ERROR, null),
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
        ephemeralReply(ADMIN_ERROR, null),
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
