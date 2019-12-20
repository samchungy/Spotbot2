const slackClient = require('./initialise');

async function sendDialog(trigger_id, dialog){
    try {
        await slackClient.dialog.open(trigger_id, dialog)
    } catch (error) {
        logger.error(error);
        throw error;
    }
}