const {checkSettings} = require('../src/settings/settings-check');

/**
 * Koa middleware for check settings
 * @param {Object} ctx
 * @param {Function} next
 */
async function checkSettingsMiddleware(ctx, next) {
  const payload = ctx.request.body;
  if (await checkSettings(payload.team_id, payload.channel_id, payload.user_id)) {
    await next();
  } else {
    ctx.body = '';
  }
}

module.exports = {
  checkSettingsMiddleware,
};
