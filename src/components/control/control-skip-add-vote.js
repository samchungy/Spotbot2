const logger = require('/opt/utils/util-logger');

// Spotify
const {isPlaying} = require('/opt/spotify/spotify-helper');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

// Slack
const {reply, postEphemeral} = require('/opt/slack/slack-api');
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {ephemeralPost, updateReply} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Skip
const {addVote} = require('/opt/control-skip/control-skip');
const {loadSkip} = require('/opt/db/settings-extra-interface');

const RESPONSE = {
  error: `:warning: Adding skip vote failed.`,
  expired: ':information_source: Skip vote has expired.',
  failed: 'Adding skip vote failed',
};

/**
 * If expired, modifies the Slack skip post.
 * @param {object} statusTrack
 * @param {object} currentSkip
 * @param {string} responseUrl
 */
const isExpired = async (statusTrack, currentSkip, responseUrl) => {
  const expired = !statusTrack || !currentSkip || !currentSkip.skip || (currentSkip.skip.track.id != statusTrack.id);
  if (expired) {
    // Expire Vote
    const expiredBlock = [textSection(RESPONSE.expired)];
    const update = updateReply(RESPONSE.expired, expiredBlock);
    await reply(update, responseUrl);
    return true;
  }
  return false;
};

/**
 * Attempts to add a vote to the skip
 * @param {string} teamId
 * @param {string} channelId
 * @param {object} settings
 * @param {string} userId
 * @param {string} responseUrl
 */
const main = async (teamId, channelId, settings, userId, responseUrl) => {
  const auth = await authSession(teamId, channelId);
  const {country} = auth.getProfile();
  const status = await fetchCurrentPlayback(auth, country);
  if (!isPlaying(status)) {
    const message = ephemeralPost(channelId, userId, RESPONSE.not_playing, null);
    return await postEphemeral(message);
  }
  const statusTrack = new Track(status.item);
  const currentSkip = await loadSkip(teamId, channelId);
  if (await isExpired(statusTrack, currentSkip, responseUrl)) {
    return;
  }
  return addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, settings, userId, responseUrl)
      .catch(async (error)=>{
        logger.error(error, RESPONSE.failed);
        await reportErrorToSlack(channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
