const {openSettings, updateView} = require('./settings-controller');
const {validateAuthCode} = require('./spotifyauth/spotifyauth-controller');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .post('/', async (ctx, next) => {
        const payload = ctx.request.body;
        const textSplit = payload.text.split(' ');
        if (textSplit.length == 0) {
        // Implement General Spotbot Help Menu
        } else {
          switch (textSplit[0]) {
            case 'settings':
              ctx.body = '';
              openSettings(payload.team_id, payload.channel_id, payload.trigger_id);
              break;
          }
        }
      })
      .get('/auth/callback', async (ctx, next) => {
        const {success, failReason, state} = await validateAuthCode(ctx.query.code, ctx.query.state);
        if (success) {
          ctx.body = 'Auth Success';
          updateView(state.teamId, state.channelId);
        } else {
          ctx.status = 401;
          ctx.body = failReason;
        }
      });
  return router;
};

