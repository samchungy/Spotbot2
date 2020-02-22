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
      .post('/', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, timestamp: null}),
          TopicArn: process.env.CONTROL_OPEN,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      })
      // .post('/skip', async (ctx, next) => {
      //   const payload = ctx.request.body;
      //   skip(payload.team_id, payload.channel_id, null, payload.user_id);
      //   ctx.body = publicAck('');
      // })
      .post('/play', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, timestamp: null, userId: payload.user_id}),
          TopicArn: process.env.CONTROL_PLAY,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      })
      .post('/pause', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, timestamp: null, userId: payload.user_id}),
          TopicArn: process.env.CONTROL_PAUSE,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      })
      .post('/reset', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, timestamp: null, userId: payload.user_id}),
          TopicArn: process.env.CONTROL_RESET_START,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      });
  return router;
};
