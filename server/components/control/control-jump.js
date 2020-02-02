const logger = require('../../util/util-logger');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {fetchPlaylistTotal} = require('../spotify-api/spotify-api-playlists');
const {loadDefaultDevice, loadPlaylist} = require('../settings/settings-interface');
const {play} = require('../spotify-api/spotify-api-playback');
const {sleep} = require('../../util/util-timeout');
const JUMP_RESPONSE = {
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  success: (userId) => `:arrow_forward: Spotify is now playing from the start of the playlist. Set by <@${userId}>.`,
  fail: ':warning: Spotify failed to jump to the start of the playlist.',
  empty: ':information_source: The Spotbot playlist is empty. Please add tracks before trying to jumping back to the playlist.',
};

/**
 * Set Spotify to play from the start of the playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} userId
 */
async function setJumpToStart(teamId, channelId, userId) {
  try {
    const status = await fetchCurrentPlayback(teamId, channelId );
    if (!status.device) {
      return {success: false, response: JUMP_RESPONSE.not_playing, status: status};
    }
    const playlist = await loadPlaylist(teamId, channelId );
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlist.id);
    if (!total) {
      return {success: false, response: JUMP_RESPONSE.empty, status: status};
    }

    await play(teamId, channelId, status.device.id, playlist.uri);
    await sleep(100);

    const newStatus = await fetchCurrentPlayback(teamId, channelId );
    if (newStatus.device && newStatus.context && newStatus.context.uri.includes(playlist.id)) {
      return {success: true, response: JUMP_RESPONSE.success(userId), status: newStatus};
    }
    return {success: false, response: JUMP_RESPONSE.fail, status: newStatus};
  } catch (error) {
    logger.error(error);
    return {success: false, response: JUMP_RESPONSE.fail, status: null};
  }
}

module.exports = {
  JUMP_RESPONSE,
  setJumpToStart,
};
