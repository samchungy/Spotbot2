const logger = require('../../util/logger');
const slackClient = require('./initialise');

/**
 * Send an open modal request to Slack
 * @param {string} triggerId Slack Trigger Id
 * @param {object} view Slack View
 */
async function sendModal(triggerId, view) {
  try {
    await slackClient.views.open({trigger_id: triggerId, view: view});
  } catch (error) {
    logger.error(error.data.response_metadata);
    throw error;
  }
}

/**
 * Send an update modal request to Slack
 * @param {string} viewId Slack View Id
 * @param {object} view Slack View
 */
async function updateModal(viewId, view) {
  try {
    await slackClient.views.update({
      view_id: viewId,
      view: view,
    });
  } catch (error) {
    logger.error(error.data.response_metadata);
    throw error;
  }
}

module.exports = {
  sendModal,
  updateModal,
};
