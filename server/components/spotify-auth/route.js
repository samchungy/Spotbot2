module.exports = ( prefix, Router ) => {
    const router = new Router({
        prefix: prefix
    });
    router.get('/', (ctx, next) => {
      ctx.body = 'Hello Spotify Auth Controller!';
    });
    return router;
  };