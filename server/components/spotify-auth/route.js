const logger = require('pino')()
const { getAuthorizationURL, getTokens } = require('./spotifyAuth');

module.exports = ( prefix, Router ) => {
    const router = new Router({
        prefix: prefix
    });
    router
    .get('/', async (ctx, next) => {
      let auth_url = await getAuthorizationURL("ABC", ctx.request.header.host);
      ctx.body = auth_url;
    })
    .get('*', async (ctx, next) => {
      logger.info(ctx);
      logger.info(ctx.query);
      ctx.body = "Test"
    })
    return router;
  };