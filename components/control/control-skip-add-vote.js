const logger = require(process.env.LOGGER);

const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {addVote} = require('/opt/control-skip/control-skip');
const {loadSkip} = require('/opt/settings/settings-extra-interface');
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {postEphemeral, reply} = require('/opt/slack/slack-api');
const {ephemeralPost, updateReply} = require('/opt/slack/format/slack-format-reply');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

const SKIP_RESPONSE = {
  error: `:warning: Adding skip vote failed.`,
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);

  try {
    let statusTrack;
    const auth = await authSession(teamId, channelId);
    const {country} = auth.getProfile();
    // Skip added from clicking add vote
    const [currentSkip, status] = await Promise.all([
      loadSkip(teamId, channelId),
      fetchCurrentPlayback(teamId, channelId, auth, country),
    ]);
    if (status.device && status.item) {
      statusTrack = new Track(status.item);
    }
    if (!statusTrack || !currentSkip || !currentSkip.skip ||
         (currentSkip.skip.track.id != statusTrack.id)) {
      // Expire Vote
      const expiredBlock = [textSection(SKIP_RESPONSE.expired)];
      await reply(
          updateReply(SKIP_RESPONSE.expired, expiredBlock),
          responseUrl,
      );
      return;
    }
    return await addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack);
  } catch (error) {
    logger.error(error);
    logger.error('Add Vote failed');
    try {
      await postEphemeral(
          ephemeralPost(channelId, userId, SKIP_RESPONSE.error, null),
      );
    } catch (error2) {
      logger.error(error2);
      logger.error('Failed to report add vote fail');
    }
  }
};
