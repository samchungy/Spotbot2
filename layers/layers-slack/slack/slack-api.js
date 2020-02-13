const logger = require(process.env.LOGGER);
const axios = require('axios');
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
    return await axios.post(responseUrl, body);
  } catch (error) {
    logger.error(`Slack API: Reply failed`, error);
    throw error;
  }
}

/**
 * Post to Slack
 * @param {Object} body
 */
async function post(body) {
  try {
    return await slackClient.chat.postMessage(body);
  } catch (error) {
    logger.error(`Slack API: Post failed`, error);
    throw error;
  }
}

/**
 * Post Ephemeral
 * @param {Object} body
 */
async function postEphemeral(body) {
  try {
    await slackClient.chat.postEphemeral(body);
  } catch (error) {
    logger.error(`Slack API: Post Ephemeral failed`, error);
    throw error;
  }
}

/**
 * Update Chat
 * @param {Object} body
 */
async function updateChat(body) {
  try {
    return await slackClient.chat.update(body);
  } catch (error) {
    logger.error(`Slack API: Update Chat failed`, error);
    throw error;
  }
}

/**
 * Deletes Chat
 * @param {Object} body
 */
async function deleteChat(body) {
  try {
    await slackClient.chat.delete(body);
  } catch (error) {
    logger.error(`Slack API: Delete Chat failed`, error);
    throw error;
  }
}

module.exports = {
  deleteChat,
  post,
  postEphemeral,
  reply,
  sendModal,
  updateChat,
  updateModal,
};
