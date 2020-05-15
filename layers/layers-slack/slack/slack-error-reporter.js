const logger = require(process.env.LOGGER);
const {postEphemeral, post} = require('/opt/slack/slack-api');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');


const reportErrorToSlack = (teamId, channelId, userId, error) => {
  const errorMessage = `:warning: ${error}. Please try again.`;
  (async () => {
    if (userId) {
      await post(
          inChannelPost(channelId, errorMessage),
      );
    } else {
      await postEphemeral(
          ephemeralPost(channelId, userId, errorMessage),
      );
    }
  })().catch((err) => {
    logger.error(err);
    logger.error(`Failed to report the following error to Slack: ${error})`);
  });
};

module.exports = {
  reportErrorToSlack,
};
