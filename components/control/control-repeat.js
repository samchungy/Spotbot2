const logger = require(process.env.LOGGER);
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {repeat} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {sleep} = require('/opt/utils/util-timeout');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {responseUpdate} = require('/opt/control-panel/control-panel');

const REPEAT_RESPONSE = {
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  cannot: ':information_source: Spotify cannot toggle repeat right now.',
  fail: ':warning: Spotify failed to toggle repeat on the playlist.',
  on: (userId) => `:information_source: Repeat was enabled by <@${userId}>.`,
  off: (userId) => `:information_source: Repeat was enabled by <@${userId}>.`,
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const auth = await authSession(teamId, channelId);
    const status = await fetchCurrentPlayback(teamId, channelId, auth);
    // Spotify is not playing
    if (!status.device) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, REPEAT_RESPONSE.not_playing, status);
    }
    if (status.actions && status.actions.disallows && status.actions.disallows.toggling_repeat_context) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, REPEAT_RESPONSE.cannot, status);
    }

    if (status.repeat_state === 'track' || status.repeat_state === 'context') {
      // Turn off repeat
      await repeat(teamId, channelId, auth, 'off');
      await sleep(400);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, true, REPEAT_RESPONSE.off(userId), null);
    } else {
      // Turn on repeat
      await repeat(teamId, channelId, auth, 'context');
      await sleep(400);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, true, REPEAT_RESPONSE.on(userId), null);
    }
  } catch (error) {
    logger.error(error);
    logger.error('Failed to toggle repeat');
    try {
      const auth = await authSession(teamId, channelId);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, REPEAT_RESPONSE.fail, null);
    } catch (error) {
      logger.error(error);
      logger.error('Failed to report control repeat fail');
    }
  }
};

