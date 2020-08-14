const logger = require('/opt/utils/util-logger');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {repeat} = require('/opt/spotify/spotify-api-v2/spotify-api-playback');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const {isPlaying} = require('/opt/spotify/spotify-helper');

// Slack
const {post, postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const RESPONSE = {
  failed: 'Toggling repeat failed',
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  cannot: ':information_source: Spotify cannot toggle repeat right now.',
  on: (userId) => `:information_source: Repeat was enabled by <@${userId}>.`,
  off: (userId) => `:information_source: Repeat was disabled by <@${userId}>.`,
};


const toggleRepeat = async (teamId, channelId, userId) => {
  const auth = await authSession(teamId, channelId);
  const status = await fetchCurrentPlayback(auth);

  if (!isPlaying(status)) {
    const message = ephemeralPost(channelId, userId, RESPONSE.not_playing);
    return await postEphemeral(message);
  }

  // Spotify cannot toggle repeat in some cases
  if (status.actions && status.actions.disallows && status.actions.disallows.toggling_repeat_context) {
    const message = ephemeralPost(channelId, userId, RESPONSE.cannot);
    return await postEphemeral(message);
  }
  if (status.repeat_state === 'track' || status.repeat_state === 'context') {
    // Turn off repeat
    await repeat(auth, 'off');
    const message = inChannelPost(channelId, RESPONSE.off(userId));
    return await post(message);
  } else {
    // Turn on repeat
    await repeat(auth, 'context');
    const message = inChannelPost(channelId, RESPONSE.on(userId));
    return await post(message);
  }
};


module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId} = JSON.parse(event.Records[0].Sns.Message);
  await toggleRepeat(teamId, channelId, userId)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
