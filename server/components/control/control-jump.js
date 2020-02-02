const config = require('config');
const logger = require('../../util/util-logger');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {fetchPlaylistTotal} = require('../spotify-api/spotify-api-playlists');
const {loadDefaultDevice, loadPlaylist} = require('../settings/settings-interface');
const {play} = require('../spotify-api/spotify-api-playback');
const {sleep} = require('../../util/util-timeout');
const JUMP = config.get('slack.responses.playback.jump');


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
      return {success: false, response: JUMP.not_playing, status: status};
    }
    const playlist = await loadPlaylist(teamId, channelId );
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlist.id);
    if (!total) {
      return {success: false, response: JUMP.empty, status: status};
    }


    const device = await loadDefaultDevice(teamId, channelId);
    await play(teamId, channelId, device.id, playlist.uri);
    await sleep(100);

    const newStatus = await fetchCurrentPlayback(teamId, channelId );
    if (newStatus.device && newStatus.context && newStatus.context.uri.includes(playlist.uri)) {
      return {success: true, response: `${JUMP.success} <@${userId}>.`, status: newStatus};
    }
  } catch (error) {
    logger.error(error);
    return {success: false, response: JUMP.fail, status: null};
  }
}

module.exports = {
  setJumpToStart,
};
