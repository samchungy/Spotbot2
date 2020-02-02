const config = require('config');
const logger = require('../../util/util-logger');
const {fetchDevices} = require('../spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {sleep} = require('../../util/util-timeout');
const {pause} = require('../spotify-api/spotify-api-playback');

const PAUSE_FAIL_RESPONSES = config.get('slack.responses.playback.pause_fail');
const PAUSE_RESPONSES = config.get('slack.responses.playback.pause');


/**
 * Pauses playback on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 */
async function setPause(teamId, channelId, userId) {
  try {
    const [status, spotifyDevices] = await Promise.all([fetchCurrentPlayback(teamId, channelId ), fetchDevices(teamId, channelId )]);

    if (!spotifyDevices.devices.length) {
      return {success: false, response: PAUSE_FAIL_RESPONSES.no_devices, status: status};
    }
    // Check if Spotify is already paused
    if (!status.is_playing) {
      return {success: false, response: PAUSE_FAIL_RESPONSES.already, status: status};
    }

    // Try Pause
    await pause(teamId, channelId, status.device.id);
    await sleep(100);
    const newStatus = await fetchCurrentPlayback(teamId, channelId );
    if (!newStatus.is_playing) {
      return {success: true, response: `${PAUSE_RESPONSES.success} <@${userId}>.`, status: newStatus};
    }
  } catch (error) {
    logger.error(error);
  }
  return {success: false, response: PAUSE_FAIL_RESPONSES.error, status: null};
}

module.exports = {
  setPause,
};
