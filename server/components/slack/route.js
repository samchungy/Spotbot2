const logger = require('pino')();
const SLACK_ACTIONS = require('config').get('slack.actions');
const { getAllUserPlaylists, saveSettings } = require('../settings/settings');

module.exports = ( prefix, Router ) => {
    const router = new Router({
        prefix: prefix
    });
    router
    .post('/', async (ctx, next) => {
        let payload = JSON.parse(ctx.request.body.payload);
        switch(payload.callback_id) {
            case SLACK_ACTIONS.settings_dialog:
                saveSettings(payload);
                ctx.body = ""
                break;
            case SLACK_ACTIONS.playlist:
                ctx.body = await getAllUserPlaylists();
                break;
        }
    })
    return router;
  };