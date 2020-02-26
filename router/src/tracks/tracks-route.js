const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();
const {publicAck} = require('/opt/slack/format/slack-format-reply');
const {checkSettingsMiddleware} = require('../../middleware/settings-middleware');

const TRACKS_CURRENT = process.env.SNS_PREFIX + 'tracks-current';
const TRACKS_FIND_ARTISTS_SEARCH = process.env.SNS_PREFIX + 'tracks-find-artists-search';
const TRACKS_FIND_SEARCH = process.env.SNS_PREFIX + 'tracks-find-search';
const TRACKS_WHOM = process.env.SNS_PREFIX + 'tracks-whom';

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
          TopicArn: TRACKS_FIND_SEARCH,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      })
      .post('/artist', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, query: payload.text, userId: payload.user_id, triggerId: payload.trigger_id}),
          TopicArn: TRACKS_FIND_ARTISTS_SEARCH,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      })
      .post('/current', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, userId: payload.user_id}),
          TopicArn: TRACKS_CURRENT,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      })
      .post('/whom', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, userId: payload.user_id}),
          TopicArn: TRACKS_WHOM,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      });
  // .post('/remove', async (ctx, next) => {
  //   const payload = ctx.request.body;
  //   removeTrackReview(payload.team_id, payload.channel_id, payload.user_id, payload.trigger_id);
  //   ctx.body = publicAck('');
  // });
  return router;
};
