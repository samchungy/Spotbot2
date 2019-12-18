const logger = require('pino')()
const { getAuthorizationURL, validateAuthCode } = require('./spotifyAuth');

module.exports = ( prefix, Router ) => {
    const router = new Router({
        prefix: prefix
    });
    router
    .get('/', async (ctx, next) => {
      //TODO ADD STATE (SLACK TRIGGER ID)
      let auth_url = await getAuthorizationURL("ABC");
      ctx.body = auth_url;
    })
    .get('/callback', async (ctx, next) => {
      let { success, failReason } = await validateAuthCode(ctx.query.code, ctx.query.state);
      if (success){
        ctx.body = "Auth Success"
        // ctx.redirect('') TODO ADD Slack URL
      } else {
        ctx.status = 401
        ctx.body = failReason;
      }
    })
    return router;
  };