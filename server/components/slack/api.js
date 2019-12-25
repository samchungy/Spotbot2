const logger = require('pino')();
const slackClient = require('./initialise');

async function sendDialog(trigger_id, dialog){
    try {
        await slackClient.dialog.open({trigger_id : trigger_id, dialog: dialog})
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

module.exports = {
    sendDialog
}