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
    find(payload.team_id, payload.channel_id, payload.user_id, payload.text);
    ctx.body = '';
  });
  return router;
};
