const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {fetchPlaylistTotal} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {responseUpdate} = require('/opt/control-panel/control-panel');
const {play} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {sleep} = require('/opt/utils/util-timeout');

const PLAYLIST = config.dynamodb.settings.playlist;
const JUMP_RESPONSE = {
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  success: (userId) => `:arrow_forward: Spotify is now playing from the start of the playlist. Set by <@${userId}>.`,
  fail: ':warning: Spotify failed to jump to the start of the playlist.',
  empty: ':information_source: The Spotbot playlist is empty. Please add tracks before trying to jumping back to the playlist.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const auth = await authSession(teamId, channelId);
    const playlist = settings[PLAYLIST];
    const status = await fetchCurrentPlayback(teamId, channelId, auth);
    if (!status.device) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, JUMP_RESPONSE.not_playing, status);
    }
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, auth, playlist.id);
    if (!total) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, JUMP_RESPONSE.empty, status);
    }

    await play(teamId, channelId, auth, status.device.id, playlist.uri);
    await sleep(400);

    const newStatus = await fetchCurrentPlayback(teamId, channelId, auth );
    if (newStatus.device && newStatus.context && newStatus.context.uri.includes(playlist.id)) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, true, JUMP_RESPONSE.success(userId), newStatus);
    }
    return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, JUMP_RESPONSE.fail, null);
  } catch (error) {
    logger.error(error);
    logger.erorr('Failed to jump back to playlist');
    try {
      const auth = await authSession(teamId, channelId);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, JUMP_RESPONSE.fail, null);
    } catch (error) {
      logger.error(error);
      logger.error('Failed to report control jump fail');
    }
  }
};
