const logger = require(process.env.LOGGER);
const {postEphemeral, post} = require('/opt/slack/slack-api');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');


const reportErrorToSlack = (teamId, channelId, userId, err) => {
  const errorMessage = `:warning: ${err}. Please try again.`;
  (async () => {
    if (!userId) {
      const message = inChannelPost(channelId, errorMessage);
      await post(message);
    } else {
      const message = ephemeralPost(channelId, userId, errorMessage);
      await postEphemeral(message);
    }
  })().catch((error) => {
    logger.error(error, `Failed to report the following error to Slack: ${errorMessage}` );
  });
};

module.exports = {
  reportErrorToSlack,
};
