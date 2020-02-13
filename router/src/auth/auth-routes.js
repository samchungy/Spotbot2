// const {updateView} = require('../server/components/settings/settings-controller');
// const {validateAuthCode} = require('../server/components/settings/spotifyauth/spotifyauth-controller');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });

  router.get('/', async (ctx, next) => {
    ctx.body = 'test';
    // const {success, failReason, state} = await validateAuthCode(ctx.query.code, ctx.query.state);
    // if (success) {
    //   ctx.body = 'Authentication Successful. Please close this window';
    //   updateView(state.teamId, state.channelId);
    // } else {
    //   ctx.status = 401;
    //   ctx.body = failReason;
    // }
  });
  return router;
};
