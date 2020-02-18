const logger = require(process.env.LOGGER);
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {fetchPlaylistTotal} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {loadPlaylist} = require('/opt/settings/settings-interface');
const {responseUpdate} = require('/opt/control-panel/control-panel');
const {play} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {sleep} = require('/opt/utils/util-timeout');
const JUMP_RESPONSE = {
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  success: (userId) => `:arrow_forward: Spotify is now playing from the start of the playlist. Set by <@${userId}>.`,
  fail: ':warning: Spotify failed to jump to the start of the playlist.',
  empty: ':information_source: The Spotbot playlist is empty. Please add tracks before trying to jumping back to the playlist.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const status = await fetchCurrentPlayback(teamId, channelId );
    if (!status.device) {
      return await responseUpdate(teamId, channelId, timestamp, false, JUMP_RESPONSE.not_playing, status);
    }
    const playlist = await loadPlaylist(teamId, channelId );
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlist.id);
    if (!total) {
      return await responseUpdate(teamId, channelId, timestamp, false, JUMP_RESPONSE.empty, status);
    }

    await play(teamId, channelId, status.device.id, playlist.uri);
    await sleep(400);

    const newStatus = await fetchCurrentPlayback(teamId, channelId );
    if (newStatus.device && newStatus.context && newStatus.context.uri.includes(playlist.id)) {
      return await responseUpdate(teamId, channelId, timestamp, true, JUMP_RESPONSE.success(userId), newStatus);
    }
    return await responseUpdate(teamId, channelId, timestamp, false, JUMP_RESPONSE.fail, null);
  } catch (error) {
    logger.error(error);
    logger.erorr('Failed to jump back to playlist');
    try {
      return await responseUpdate(teamId, channelId, timestamp, false, JUMP_RESPONSE.fail, null);
    } catch (error) {
      logger.error(error);
      logger.error('Failed to report control jump fail');
    }
  }
};
