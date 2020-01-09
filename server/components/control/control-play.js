const config = require('config');
const logger = require('../../util/util-logger');
const {loadDefaultDevice, loadPlaylistSetting} = require('../settings/settings-dal');
const {play} = require('../spotify-api/spotify-api-playback');
const {fetchDevices} = require('../spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {idToUri} = require('../../util/util-spotify-context');
const {PlaybackError} = require('../../errors/errors-playback');
const {sleep} = require('../../util/util-timeout');
const NO_DEVICES = config.get('dynamodb.settings_helper.no_devices');
const PLAY_RESPONSES = config.get('slack.responses.playback.play');
const PLAY_FAIL_RESPONSES = config.get('slack.responses.playback.play_fail');
const noSongs = (status, playlist) => status.is_playing && !status.item && status.context && status.context.uri.includes(playlist.id);

/**
 * Try to play Spotify
 */
async function setPlay() {
  try {
    const status = await fetchCurrentPlayback();
    const playlist = await loadPlaylistSetting();

    // Spotify is already running
    if (status.is_playing && status.item) {
      return {success: false, response: PLAY_FAIL_RESPONSES.already, status: status};
    }
    // We have an empty playlist and status is IsPlaying
    if (noSongs(status, playlist)) {
      return {success: false, response: PLAY_FAIL_RESPONSES.empty_playlist, status: status};
    }

    // If we are playing from a spotify device already, just keep using it
    if (status.device) {
      return await attemptPlay(status.device.id, status, playlist, 0);
    }

    // Load our default Device and fetch all available Spotify devices
    const device = await loadDefaultDevice();
    const spotifyDevices = await fetchDevices();

    if (device.id != NO_DEVICES) {
      // Default device selected
      if (spotifyDevices.devices.length == 0 || spotifyDevices.devices.find(({id}) => id === device.id)) {
        // If selected devices is not turned on
        return {success: false, response: PLAY_FAIL_RESPONSES.no_device, status: status};
      }
      // Use our selected devices.
      return await attemptPlay(device.id, status, playlist, 0);
    } else {
      // No default device selected -- Choose any available
      if (spotifyDevices.devices.length == 0) {
        // No devices available to use
        return {success: false, response: PLAY_FAIL_RESPONSES.no_devices, status: status};
      } else {
        // Use the first available device
        return await attemptPlay(spotifyDevices.devices[0].id, status, playlist, 0);
      }
    }
  } catch (error) {
    logger.error(error);
  }
  return {success: false, response: PLAY_FAIL_RESPONSES.error, status: null};
}

/**
 * Recursive Retries to Play
 * @param {String} deviceId
 * @param {Object} status
 * @param {Object} playlist
 * @param {Number} attempt
 */
async function attemptPlay(deviceId, status, playlist, attempt) {
  if (attempt) {
    // Base Cases
    if (status.is_playing && status.item) {
      return {success: true, response: PLAY_RESPONSES.success, status: status};
    }
    // We have an empty playlist and status is IsPlaying
    if (noSongs(status, playlist)) {
      return {success: false, response: PLAY_FAIL_RESPONSES.empty_playlist, status: status};
    }
    if (attempt == 2) {
      throw new PlaybackError();
    }
  }

  // Unique Spotify edge case where it gets stuck
  if (status && status.currently_playing_type=='unknown' && !status.context && !status.item) {
    await play(deviceId, idToUri(playlist.id));
  } else {
    await play(deviceId);
  }
  // Wait before verifying that Spotify is playing
  await sleep(1000);
  const newStatus = await fetchCurrentPlayback();
  return await attemptPlay(deviceId, newStatus, playlist, attempt+1);
}

module.exports = {
  setPlay,
};
