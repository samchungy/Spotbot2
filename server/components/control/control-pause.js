const logger = require('../../util/util-logger');
const {fetchDevices} = require('../spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {sleep} = require('../../util/util-timeout');
const {pause} = require('../spotify-api/spotify-api-playback');

const PAUSE_RESPONSE = {
  success: (userId) => `:double_vertical_bar: Spotify was paused by <@${userId}>.`,
  no_devices: ':warning: Spotify is not open on any device.',
  already: ':information_source: Spotify is already paused.',
  error: ':warning: An error occured.',
};

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
      return {success: false, response: PAUSE_RESPONSE.no_devices, status: status};
    }
    // Check if Spotify is already paused
    if (!status.is_playing) {
      return {success: false, response: PAUSE_RESPONSE.already, status: status};
    }

    // Try Pause
    await pause(teamId, channelId, status.device.id);
    await sleep(100);
    const newStatus = await fetchCurrentPlayback(teamId, channelId );
    if (!newStatus.is_playing) {
      return {success: true, response: PAUSE_RESPONSE.success(userId), status: newStatus};
    }
  } catch (error) {
    logger.error(error);
  }
  return {success: false, response: PAUSE_RESPONSE.error, status: null};
}

module.exports = {
  setPause,
};
