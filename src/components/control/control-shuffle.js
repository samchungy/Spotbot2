const logger = require('/opt/utils/util-logger');

// Spotify
const {shuffle} = require('/opt/spotify/spotify-api-v2/spotify-api-playback');
const authSession = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const {isPlaying} = require('/opt/spotify/spotify-helper');

// Slack
const {post, postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const SHUFFLE_RESPONSE = {
  failed: 'Toggling shuffle failed',
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  cannot: ':information_source: Spotify cannot toggle shuffle right now.',
  on: (userId) => `:information_source: Shuffle was enabled by <@${userId}>.`,
  off: (userId) => `:information_source: Shuffle was disabled by <@${userId}>.`,
};

const toggleShuffle = async (teamId, channelId, userId) => {
  const auth = await authSession(teamId, channelId);
  const status = await fetchCurrentPlayback(auth);

  if (!isPlaying(status)) {
    const message = ephemeralPost(channelId, userId, SHUFFLE_RESPONSE.not_playing);
    return await postEphemeral(message);
  }

  // Spotify cannot toggle repeat in some cases
  if (status.actions && status.actions.disallows && status.actions.disallows.toggling_shuffle) {
    const message = ephemeralPost(channelId, userId, SHUFFLE_RESPONSE.cannot);
    return await postEphemeral(message);
  }

  if (status.shuffle_state) {
    // Turn off shuffle
    await shuffle(auth, false);
    const message = inChannelPost(channelId, SHUFFLE_RESPONSE.off(userId));
    return await post(message);
  } else {
    // Turn on Shuffle
    await shuffle(auth, true);
    const message = inChannelPost(channelId, SHUFFLE_RESPONSE.on(userId));
    return await post(message);
  }
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId} = JSON.parse(event.Records[0].Sns.Message);
  await toggleShuffle(teamId, channelId, userId)
      .catch((error)=>{
        logger.error(error, SHUFFLE_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, SHUFFLE_RESPONSE.failed);
      });
};
