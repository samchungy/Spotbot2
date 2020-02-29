const {postEphemeral, reply} = require('/opt/slack/slack-api');
const {ephemeralPost, updateReply} = require('/opt/slack/format/slack-format-reply');

const CANCEL_RESPONSE = {
  cancelled: `:information_source: Search cancelled.`,
  error: `:warning: Cancelling search failed. Please try again`,
};

module.exports.handler = async (event, context) => {
  const {responseUrl, userId, channelId} = JSON.parse(event.Records[0].Sns.Message);
  try {
    await reply(
        updateReply(CANCEL_RESPONSE.cancelled, null),
        responseUrl,
    );
  } catch (error) {
    logger.error(error);
    logger.error('Cancelling search failed');
    try {
      await postEphemeral(
          ephemeralPost(channelId, userId, CANCEL_RESPONSE.error, null),
      );
    } catch (error2) {
      logger.error(error2);
      logger.error('Failed to report cancel search error');
    }
  }
};
