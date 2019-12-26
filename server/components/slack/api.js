const logger = require('pino')();
const slackClient = require('./initialise');

async function sendDialog(trigger_id, dialog){
    try {
        await slackClient.dialog.open({trigger_id : trigger_id, dialog: dialog})
    } catch (error) {
        if (error.code && error.code == `slack_webapi_platform_error`){
            if (error.data.error == `validation_errors`){
                logger.error(JSON.stringify(error.data.response_metadata));
            }
        }
        throw error;
    }
}

module.exports = {
    sendDialog
}