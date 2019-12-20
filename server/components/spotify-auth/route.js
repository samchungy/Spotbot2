const logger = require('pino')()
const { validateAuthCode } = require('./spotifyAuth');

module.exports = ( prefix, Router ) => {
    const router = new Router({
        prefix: prefix
    });
    router
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