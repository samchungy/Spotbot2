const logger = require('../../util/logger');
const config = require('config');
const SLACK_ACTIONS = config.get('slack.actions');
const PLAYLIST = config.get('dynamodb.settings.playlist');
const DEFAULT_DEVICE = config.get('dynamodb.settings.default_device');
const { getAllDevices, getAllUserPlaylists, saveSettings } = require('../settings/settings');

module.exports = ( prefix, Router ) => {
    const router = new Router({
        prefix: prefix
    });
    router
    .post('/', async (ctx, next) => {
        let payload = JSON.parse(ctx.request.body.payload);
        if (payload.type == `view_submission`){
            switch(payload.view.callback_id) {
                case SLACK_ACTIONS.settings_modal:
                    let errors = await saveSettings(payload.view, payload.response_url);
                    if (errors){
                        ctx.body = errors;
                    } else {
                        ctx.body = ""
                    }
                    break;
            }    
        }
    })
    .post('/options', async (ctx, next) =>{
        let payload = JSON.parse(ctx.request.body.payload);
        let options;
        switch(payload.action_id){
            case PLAYLIST:
                options = await getAllUserPlaylists(payload.value);
                ctx.body = options;
                break;
            case DEFAULT_DEVICE:
                options = await getAllDevices();
                ctx.body = options;
                break;
        }
    })

    return router;
  };