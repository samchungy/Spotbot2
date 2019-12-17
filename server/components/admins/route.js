module.exports = ( prefix, Router ) => {
    const router = new Router({
        prefix: prefix
    });
    router.get('/', async (ctx, next) => {
      ctx.body = 'Hello Admin!';
    });
    return router;
};