const logger = require('/opt/utils/util-logger');
const axios = require('axios');
const slackClient = require('./slack-initialise');

/**
 * Send an open modal request to Slack
 * @param {string} triggerId Slack Trigger Id
 * @param {object} view Slack View
 */
const sendModal = async (triggerId, view) => {
  return await slackClient.views.open({trigger_id: triggerId, view: view})
      .catch((error) => {
        logger.error(error, 'Slack API: Opening Modal failed');
        throw error;
      });
};

/**
 * Send an update modal request to Slack
 * @param {string} viewId Slack View Id
 * @param {object} view Slack View
 */
const updateModal = async (viewId, view) => {
  return await slackClient.views.update({
    view_id: viewId,
    view: view,
  }).catch((error) => {
    logger.error(error, 'Slack API: Updating Modal failed');
    throw error;
  });
};

/**
 * Pushed a modal on top to Slack
 * @param {object} view Slack View
 * @param {string} triggerId Slack trigger id
 */
const pushModal = async (view, triggerId) => {
  return await slackClient.views.push({
    view: view,
    trigger_id: triggerId,
  }).catch((error) => {
    logger.error(error, 'Slack API: Pushing Modal failed');
    throw error;
  });
};

/**
 * Post to Slack
 * @param {Object} body
 */
const post = async (body) => {
  return await slackClient.chat.postMessage(body)
      .catch((error) => {
        logger.error(error, 'Slack API: Post failed');
        throw error;
      });
};

/**
 * Post Ephemeral
 * @param {Object} body
 */
const postEphemeral = async (body) => {
  return await slackClient.chat.postEphemeral(body)
      .catch((error) => {
        logger.error(error, 'Slack API: Post Ephemeral failed');
        throw error;
      });
};

/**
 * Reply to a Slack Slash Command via Response URL
 * @param {*} body
 * @param {*} responseUrl
 */
const reply = async (body, responseUrl) => {
  return await axios.post(responseUrl, body)
      .catch((error) => {
        logger.error(error, 'Slack API: Reply failed');
        throw error;
      });
};

/**
 * Update Chat
 * @param {Object} body
 */
const updateChat = async (body) => {
  return await slackClient.chat.update(body)
      .catch((error) => {
        logger.error(error, 'Slack API: Update Chat failed');
        throw error;
      });
};

/**
 * Deletes Chat
 * @param {Object} body
 */
const deleteChat = async (body) => {
  return await slackClient.chat.delete(body)
      .catch((error) => {
        logger.error(error, 'Slack API: Delete Chat failed');
        throw error;
      });
};

/**
 * Gets Channel/Group info
 * @param {string} channel
 */
const getConversationInfo = async (channel) => {
  return await slackClient.conversations.info({channel: channel})
      .catch((error) => {
        logger.error(error, 'Slack API: Get Conversation Info failed');
        throw error;
      });
};

module.exports = {
  deleteChat,
  getConversationInfo,
  post,
  postEphemeral,
  pushModal,
  reply,
  sendModal,
  updateChat,
  updateModal,
};
