const {find} = require('../tracks/tracks-controller');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router.post('/find', (ctx, next) => {
    const payload = ctx.request.body;
    find(payload.team_id, payload.channel_id, payload.user_id, payload.text);
    ctx.body = '';
  });
  return router;
};
