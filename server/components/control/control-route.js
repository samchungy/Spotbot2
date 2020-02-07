const {openControls} = require('./control-controller');
const {publicAck} = require('../slack/format/slack-format-reply');
const {checkSettingsMiddleware} = require('../settings/settings-middleware');
const {pause, play, reset, skip} = require('../control/control-controller');
const slackVerifyMiddleware = require('../slack/slack-middleware');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .use(slackVerifyMiddleware)
      .use(checkSettingsMiddleware)
      .post('/', async (ctx, next) => {
        const payload = ctx.request.body;
        openControls(payload.team_id, payload.channel_id);
        ctx.body = publicAck('');
      })
      .post('/skip', async (ctx, next) => {
        const payload = ctx.request.body;
        skip(payload.team_id, payload.channel_id, null, payload.user_id);
        ctx.body = publicAck('');
      })
      .post('/play', async (ctx, next) => {
        const payload = ctx.request.body;
        play(payload.team_id, payload.channel_id, null, payload.user_id);
        ctx.body = publicAck('');
      })
      .post('/pause', async (ctx, next) => {
        const payload = ctx.request.body;
        pause(payload.team_id, payload.channel_id, null, payload.user_id);
        ctx.body = publicAck('');
      })
      .post('/reset', async (ctx, next) => {
        const payload = ctx.request.body;
        reset(payload.team_id, payload.channel_id, null, payload.user_id, payload.trigger_id);
        ctx.body = publicAck('');
      });
  return router;
};
