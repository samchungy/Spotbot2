const logger = require('/opt/utils/util-logger');
const {postEphemeral, post} = require('/opt/slack/slack-api');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');


const reportErrorToSlack = async (channelId, userId, err) => {
  const errorMessage = `:warning: ${err}. Please try again.`;
  const sendError = async () => {
    if (!userId) {
      const message = inChannelPost(channelId, errorMessage);
      await post(message);
    } else {
      const message = ephemeralPost(channelId, userId, errorMessage);
      await postEphemeral(message);
    }
  };
  return await sendError().catch((error) => {
    logger.error(error, `Failed to report the following error to Slack: ${errorMessage}` );
  });
};


module.exports = {
  reportErrorToSlack,
};
