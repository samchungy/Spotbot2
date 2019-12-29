const logger = require('../../util/logger');
const slackClient = require('./initialise');

async function sendModal(trigger_id, view){
    try {
        await slackClient.views.open({trigger_id: trigger_id, view: view});
    } catch (error) {
        logger.error(error.data.response_metadata);
        throw error;
    }
}

async function updateModal(view_id, view){
    try {
        await slackClient.views.update({
            view_id: view_id,
            view: view
        })
    } catch (error) {
        logger.error(error.data.response_metadata);
        throw error;
    }
}

module.exports = {
    sendModal,
    updateModal
}