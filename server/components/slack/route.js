const logger = require('../../util/logger');
const config = require('config');
const SLACK_ACTIONS = config.get('slack.actions');
const { getAllUserPlaylists, saveSettings } = require('../settings/settings');

module.exports = ( prefix, Router ) => {
    const router = new Router({
        prefix: prefix
    });
    router
    .post('/', async (ctx, next) => {
        let payload = JSON.parse(ctx.request.body.payload);
        logger.info(payload);
        switch(payload.callback_id) {
            case SLACK_ACTIONS.settings_dialog:
                let errors = await saveSettings(payload.submission, payload.response_url);
                if (errors){
                    ctx.body = errors;
                } else {
                    ctx.body = ""
                }
                break;
        }
    })
    .post('/options', async (ctx, next) =>{
        let payload = JSON.parse(ctx.request.body.payload);
        switch(payload.callback_id) {
            case SLACK_ACTIONS.settings_dialog:
                let options = await getAllUserPlaylists(payload.value);
                ctx.body = options;
                break;
        }
    })

    return router;
  };