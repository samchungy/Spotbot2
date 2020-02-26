const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();
const {publicAck} = require('/opt/slack/format/slack-format-reply');
const {checkSettingsMiddleware} = require('../../middleware/settings-middleware');

const CONTROL_OPEN = process.env.SNS_PREFIX + 'control-open';
const CONTROL_SKIP_START = process.env.SNS_PREFIX + 'control-skip-start';
const CONTROL_PLAY = process.env.SNS_PREFIX + 'control-play';
const CONTROL_PAUSE = process.env.SNS_PREFIX + 'control-pause';
const CONTROL_RESET_START = process.env.SNS_PREFIX + 'control-reset-start';

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
          TopicArn: CONTROL_OPEN,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      })
      .post('/skip', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, timestamp: null, userId: payload.user_id}),
          TopicArn: CONTROL_SKIP_START,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      })
      .post('/play', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, timestamp: null, userId: payload.user_id}),
          TopicArn: CONTROL_PLAY,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      })
      .post('/pause', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, timestamp: null, userId: payload.user_id}),
          TopicArn: CONTROL_PAUSE,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      })
      .post('/reset', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, timestamp: null, userId: payload.user_id}),
          TopicArn: CONTROL_RESET_START,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      });
  return router;
};
