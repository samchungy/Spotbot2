const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();
const {publicAck} = require('/opt/slack/format/slack-format-reply');
const {checkSettingsMiddleware} = require('../../middleware/settings-middleware');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .use(checkSettingsMiddleware)
      .post('/find', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, query: payload.text, userId: payload.user_id, triggerId: payload.trigger_id}),
          TopicArn: process.env.TRACKS_FIND_SEARCH,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      });
  // .post('/artist', async (ctx, next) => {
  //   const payload = ctx.request.body;
  //   findArtists(payload.team_id, payload.channel_id, payload.user_id, payload.text, payload.trigger_id);
  //   ctx.body = publicAck('');
  // })
  // .post('/current', async (ctx, next) => {
  //   const payload = ctx.request.body;
  //   getCurrentInfo(payload.team_id, payload.channel_id);
  //   ctx.body = publicAck('');
  // })
  // .post('/whom', async (ctx, next) => {
  //   const payload = ctx.request.body;
  //   getWhom(payload.team_id, payload.channel_id);
  //   ctx.body = publicAck('');
  // })
  // .post('/remove', async (ctx, next) => {
  //   const payload = ctx.request.body;
  //   removeTrackReview(payload.team_id, payload.channel_id, payload.user_id, payload.trigger_id);
  //   ctx.body = publicAck('');
  // });
  return router;
};
