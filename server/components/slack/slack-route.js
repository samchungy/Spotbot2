const config = require('config');
const SLACK_ACTIONS = config.get('slack.actions');
const PLAYLIST = config.get('dynamodb.settings.playlist');
const DEFAULT_DEVICE = config.get('dynamodb.settings.default_device');
const AUTH_URL = config.get('dynamodb.settings_helper.auth_url');
const REAUTH = config.get('dynamodb.settings_helper.reauth');
const {changeAuthentication, getAllDevices, getAllPlaylists, saveSettings, saveView, updateView} = require('../settings/settings-controller');

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
                  await updateView(null, payload.view.id, payload.trigger_id);
                  ctx.body = '';
                  break;
              }
              break;
            }
          case SLACK_ACTIONS.view_submission:
            switch (payload.view.callback_id) {
              case SLACK_ACTIONS.settings_modal:
                const errors = await saveSettings(payload.view, payload.response_url);
                if (errors) {
                  ctx.body = errors;
                } else {
                  ctx.body = '';
                }
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
        }
      });

  return router;
};
