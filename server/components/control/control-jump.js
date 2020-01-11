const config = require('config');
const logger = require('pino')();
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {loadDefaultDevice, loadPlaylistSetting} = require('../settings/settings-dal');
const {play} = require('../spotify-api/spotify-api-playback');
const {sleep} = require('../../util/util-timeout');
const JUMP = config.get('slack.responses.playback.jump');


/**
 * Set Spotify to play from the start of the playlist
 * @param {String} userId
 */
async function setJumpToStart(userId) {
  try {
    const status = await fetchCurrentPlayback();
    if (!status.device) {
      return {success: false, response: JUMP.not_playing, status: status};
    }

    const [playlist, device] = await Promise.all([loadPlaylistSetting(), loadDefaultDevice()]);
    await play(device.id, playlist.uri);
    await sleep(100);

    const newStatus = await fetchCurrentPlayback();
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
