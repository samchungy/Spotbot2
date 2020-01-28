const {openControls} = require('./control-controller');
const {publicAck} = require('../slack/format/slack-format-reply');
const {checkSettingsMiddleware} = require('../settings/settings-middleware');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .use(checkSettingsMiddleware)
      .post('/', async (ctx, next) => {
        const payload = ctx.request.body;
        openControls(payload.team_id, payload.channel_id);
        ctx.body = publicAck('');
      });
  return router;
};
