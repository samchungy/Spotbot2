const {find, getCurrentInfo, getWhom} = require('../tracks/tracks-controller');
const {publicAck} = require('../slack/format/slack-format-reply');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .post('/find', (ctx, next) => {
        const payload = ctx.request.body;
        find(payload.team_id, payload.channel_id, payload.user_id, payload.text, payload.trigger_id);
        ctx.body = publicAck('');
      })
      .post('/current', (ctx, next) => {
        const payload = ctx.request.body;
        getCurrentInfo(payload.team_id, payload.channel_id);
        ctx.body = publicAck('');
      })
      .post('/whom', (ctx, next) => {
        const payload = ctx.request.body;
        getWhom(payload.team_id, payload.channel_id);
        ctx.body = publicAck('');
      });
  return router;
};
