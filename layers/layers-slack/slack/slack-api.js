const logger = require(process.env.LOGGER);
const axios = require('axios');
const slackClient = require('./slack-initialise');

/**
 * Send an open modal request to Slack
 * @param {string} triggerId Slack Trigger Id
 * @param {object} view Slack View
 */
const sendModal = async (triggerId, view) => {
  return await slackClient.views.open({trigger_id: triggerId, view: view})
      .catch((err) => {
        logger.error('Slack API: Opening Modal failed');
        logger.error(err);
        throw err;
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
  }).catch((err) => {
    logger.error('Slack API: Updating Modal failed');
    logger.error(err);
    throw err;
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
  }).catch((err) => {
    logger.error('Slack API: Pushing Modal failed');
    logger.error(err);
    throw err;
  });
};

/**
 * Post to Slack
 * @param {Object} body
 */
const post = async (body) => {
  return await slackClient.chat.postMessage(body)
      .catch((err) => {
        logger.error('Slack API: Post failed');
        logger.error(err);
        throw err;
      });
};

/**
 * Post Ephemeral
 * @param {Object} body
 */
const postEphemeral = async (body) => {
  return await slackClient.chat.postEphemeral(body)
      .catch((err) => {
        logger.error('Slack API: Post Ephemeral failed');
        logger.error(err);
        throw err;
      });
};

/**
 * Reply to a Slack Slash Command via Response URL
 * @param {*} body
 * @param {*} responseUrl
 */
const reply = async (body, responseUrl) => {
  return await axios.post(responseUrl, body)
      .catch((err) => {
        logger.error('Slack API: Reply failed');
        logger.error(err);
        throw err;
      });
};

/**
 * Update Chat
 * @param {Object} body
 */
const updateChat = async (body) => {
  return await slackClient.chat.update(body)
      .catch((err) => {
        logger.error('Slack API: Update Chat failed');
        logger.error(err);
        throw err;
      });
};

/**
 * Deletes Chat
 * @param {Object} body
 */
const deleteChat = async (body) => {
  return await slackClient.chat.delete(body)
      .catch((err) => {
        logger.error('Slack API: Delete Chat failed');
        logger.error(err);
        throw err;
      });
};

/**
 * Gets Channel/Group info
 * @param {string} channel
 */
const getConversationInfo = async (channel) => {
  return await slackClient.conversations.info({channel: channel})
      .catch((err) => {
        logger.error('Slack API: Get Conversation Info failed');
        logger.error(err);
        throw err;
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
