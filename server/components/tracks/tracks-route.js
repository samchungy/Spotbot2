const {inChannelReply} = require('../slack/format/slack-format-reply');
const {reply} = require('../slack/slack-api');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router.post('/', (ctx, next) => {
    const payload = ctx.request.body;
    ctx.body = '';
    reply(
        inChannelReply('Hello World'),
        payload.response_url,
    );
  });
  return router;
};
