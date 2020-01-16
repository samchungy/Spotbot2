const config = require('config');
const logger = require('pino')();
const SLACK_ACTIONS = config.get('slack.actions');
const PLAYLIST = config.get('dynamodb.settings.playlist');
const DEFAULT_DEVICE = config.get('dynamodb.settings.default_device');
const TIMEZONE = config.get('dynamodb.settings.timezone');
const AUTH_URL = config.get('dynamodb.settings_helper.auth_url');
const REAUTH = config.get('dynamodb.settings_helper.reauth');
const CONTROLS = config.get('slack.actions.controls');
const OVERFLOW = config.get('slack.actions.controller_overflow');
const {changeAuthentication, getAllDevices, getAllPlaylists, getAllTimezones, saveSettings, saveView, updateView} = require('../settings/settings-controller');
const {jumpToStart, pause, play, skip, toggleRepeat, toggleShuffle, voteToSkip} = require('../control/control-controller');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .post('/', async (ctx, next) => {
        const payload = JSON.parse(ctx.request.body.payload);
        switch (payload.type) {
          case SLACK_ACTIONS.block_actions:
            if (payload.actions.length > 0) {
              switch (payload.actions[0].action_id) {
                case AUTH_URL:
                  saveView(payload.view.id, payload.trigger_id);
                  ctx.body = '';
                  break;
                case REAUTH:
                  await changeAuthentication();
                  updateView(null, payload.view.id, payload.trigger_id);
                  ctx.body = '';
                  break;
                case CONTROLS.play:
                  play(payload.response_url, payload.channel.id);
                  ctx.body = '';
                  break;
                case CONTROLS.pause:
                  pause(payload.response_url, payload.channel.id, payload.user.id);
                  ctx.body = '';
                  break;
                case CONTROLS.skip:
                  skip(payload.message.ts, payload.channel.id, payload.user.id);
                  ctx.body = '';
                  break;
                case SLACK_ACTIONS.skip_vote:
                  voteToSkip(payload.channel.id, payload.user.id, payload.actions[0].value, payload.response_url);
                  ctx.body = '';
                  break;
                case OVERFLOW:
                  switch (payload.actions[0].selected_option.value) {
                    case CONTROLS.jump_to_start:
                      jumpToStart(payload.message.ts, payload.channel.id, payload.user.id);
                      ctx.body = '';
                      break;
                    case CONTROLS.shuffle:
                      toggleShuffle(payload.response_url, payload.channel.id, payload.user.id);
                      ctx.body = '';
                      break;
                    case CONTROLS.repeat:
                    case CONTROLS.reset:
                      reset(payload.message.ts, payload.channel.id, payload.user.id, payload.trigger_id);
                      ctx.body = '';
                      break;
                    case CONTROLS.clear_one:
                      clearOneDay(payload.message.ts, payload.channel.id, payload.user.id);
                      ctx.body = '';
                      break;
                  }
                  break;
              }
              break;
            }
          case SLACK_ACTIONS.view_submission:
            switch (payload.view.callback_id) {
              case SLACK_ACTIONS.settings_modal:
                const errors = await saveSettings(payload.view, payload.user.id);
                if (errors) {
                  ctx.body = errors;
                } else {
                  ctx.body = '';
                }
                break;
              case SLACK_ACTIONS.reset_review:
                verifyResetReview(false, payload.view, payload.user.id);
                ctx.body = '';
                break;
            }
            break;
        }
      })
      .post('/options', async (ctx, next) =>{
        const payload = JSON.parse(ctx.request.body.payload);
        let options;
        switch (payload.action_id) {
          case PLAYLIST:
            options = await getAllPlaylists(payload.value);
            ctx.body = options;
            break;
          case DEFAULT_DEVICE:
            options = await getAllDevices();
            ctx.body = options;
            break;
          case TIMEZONE:
            options = await getAllTimezones(payload.value);
            ctx.body = options;
            break;
        }
      });

  return router;
};
