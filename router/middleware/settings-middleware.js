const {checkSettings} = require('../src/settings/settings-check');

/**
 * Koa middleware for check settings
 * @param {Object} ctx
 * @param {Function} next
 */
async function checkSettingsMiddleware(ctx, next) {
  const payload = ctx.request.body;
  const settings = await checkSettings(payload.team_id, payload.channel_id, payload.user_id);
  if (settings) {
    ctx.state.settings = settings;
    await next();
  } else {
    ctx.body = '';
  }
}

module.exports = {
  checkSettingsMiddleware,
};
