const logger = require('/opt/utils/util-logger');
const {getConversationInfo} = require('/opt/slack/slack-api');

/**
 * Determine if Spotbot is in channel
 * @param {string} channelId
 */
async function checkIsInChannel(channelId) {
  try {
    const info = await getConversationInfo(channelId);
    if (info.ok && info.channel && info.channel.is_member) {
      return true;
    }
  } catch (error) {
    logger.error(error);
  }
  return false;
}

module.exports = {
  checkIsInChannel,
};
