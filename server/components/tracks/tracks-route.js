const {find, findArtists, getCurrentInfo, getWhom, removeTrackReview} = require('../tracks/tracks-controller');
const {checkSettingsMiddleware} = require('../settings/settings-middleware');
const {publicAck} = require('../slack/format/slack-format-reply');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .use(checkSettingsMiddleware)
      .post('/find', async (ctx, next) => {
        const payload = ctx.request.body;
        find(payload.team_id, payload.channel_id, payload.user_id, payload.text, payload.trigger_id);
        ctx.body = publicAck('');
      })
      .post('/artist', async (ctx, next) => {
        const payload = ctx.request.body;
        findArtists(payload.team_id, payload.channel_id, payload.user_id, payload.text, payload.trigger_id);
        ctx.body = publicAck('');
      })
      .post('/current', async (ctx, next) => {
        const payload = ctx.request.body;
        getCurrentInfo(payload.team_id, payload.channel_id);
        ctx.body = publicAck('');
      })
      .post('/whom', async (ctx, next) => {
        const payload = ctx.request.body;
        getWhom(payload.team_id, payload.channel_id);
        ctx.body = publicAck('');
      })
      .post('/remove', async (ctx, next) => {
        const payload = ctx.request.body;
        removeTrackReview(payload.team_id, payload.channel_id, payload.user_id, payload.trigger_id);
        ctx.body = publicAck('');
      });
  return router;
};
