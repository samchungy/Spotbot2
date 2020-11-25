const {SetupError} = require('/opt/errors/errors-settings');

const {getConversationInfo} = require('/opt/slack/slack-api');

const ERROR_MESSAGES = {
  setup_error: ':information_source: Spotbot is not installed in this channel. Please run `/invite @spotbot` and try again.',
};

/**
 * Determine if Spotbot is in channel
 * @param {string} channelId
 */
const checkIsInChannel = async (channelId) => {
  const info = await getConversationInfo(channelId);
  if (info.ok && info.channel && info.channel.is_member) {
    return true;
  }
  return Promise.reject(new SetupError(ERROR_MESSAGES.setup_error));
};

module.exports = {
  checkIsInChannel,
  ERROR_MESSAGES,
};
