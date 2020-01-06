const logger = require('../../util/util-logger');
const slackClient = require('./slack-initialise');

/**
 * Send an open modal request to Slack
 * @param {string} triggerId Slack Trigger Id
 * @param {object} view Slack View
 */
async function sendModal(triggerId, view) {
  try {
    await slackClient.views.open({trigger_id: triggerId, view: view});
  } catch (error) {
    logger.error(`Slack API: Opening Modal failed`, error);
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
    logger.error(`Slack API: Update Modal failed`, error);
    logger.error(error.data.response_metadata);
    throw error;
  }
}

/**
 * Reply to a Slack Slash Command via Response URL
 * @param {*} body
 * @param {*} responseUrl
 */
async function reply(body, responseUrl) {
  try {
    await axios.post(responseUrl, body);
    return;
  } catch (error) {
    logger.error(`Slack API: Reply failed`, error);
    throw error;
  }
}

module.exports = {
  reply,
  sendModal,
  updateModal,
};
