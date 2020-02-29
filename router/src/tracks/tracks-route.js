const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();

const config = require(process.env.CONFIG);
const {openModal} = require('../response/open-modal');
const {publicAck} = require('/opt/slack/format/slack-format-reply');
const {checkSettingsMiddleware} = require('../../middleware/settings-middleware');

const TRACKS_CURRENT = process.env.SNS_PREFIX + 'tracks-current';
const TRACKS_FIND_ARTISTS_SEARCH = process.env.SNS_PREFIX + 'tracks-find-artists-search';
const TRACKS_FIND_SEARCH = process.env.SNS_PREFIX + 'tracks-find-search';
const TRACKS_REMOVE_OPEN = process.env.SNS_PREFIX + 'tracks-remove-open';
const TRACKS_WHOM = process.env.SNS_PREFIX + 'tracks-whom';
const EMPTY_MODAL = config.slack.actions.empty_modal;

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
      })
      .post('/remove', async (ctx, next) => {
        const payload = ctx.request.body;
        const settings = ctx.state.settings;
        const removePayload = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Remove Tracks', 'Confirm', 'Cancel');
        params = {
          Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings: settings, viewId: removePayload.view.id, userId: payload.user_id}),
          TopicArn: TRACKS_REMOVE_OPEN,
        };
        await sns.publish(params).promise();
        ctx.body = publicAck('');
      });
  return router;
};
