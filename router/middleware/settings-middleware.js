const {checkSettings} = require('../src/settings/settings-check');

const MIDDLEWARE_RESPONSE = {
  settings_error: ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.',
};

/**
 * Koa middleware for check settings
 * @param {Object} ctx
 * @param {Function} next
 */
async function checkSettingsMiddleware(ctx, next) {
  const payload = ctx.request.body;
  const settings = await checkSettings(payload.team_id, payload.channel_id, payload.user_id, payload.response_url);
  if (settings) {
    ctx.state.settings = settings;
    await next();
  } else {
    ctx.body = MIDDLEWARE_RESPONSE.settings_error;
  }
}

module.exports = {
  checkSettingsMiddleware,
};
