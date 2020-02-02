const config = require('config');
const logger = require('../../util/util-logger');

const {loadDefaultDevice, loadPlaylist} = require('../settings/settings-interface');
const {play} = require('../spotify-api/spotify-api-playback');
const {fetchDevices} = require('../spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {PlaybackError} = require('../../errors/errors-playback');
const {sleep} = require('../../util/util-timeout');

const NO_DEVICES = config.get('dynamodb.settings_helper.no_devices');
const PLAY_FAIL_RESPONSE = {
  already: ':information_source: Spotify is already playing. Check if speaker is muted.',
  empty: ':information_source: Playlist is empty. Please add songs to the playlist.',
  no_device: ':warning: Spotify is not open on your selected device.',
  no_devices: ':warning: Spotify is not open on any device.',
  error: ':warning: An error occured.',
  empty_playlist: ':information_source: Playlist is empty. Please add songs to the playlist.',
};
const PLAY_RESPONSE = {
  success: (user) => `:arrow_forward: Spotify is now playing. Started by <@${user}>.`,
};
const noSongs = (status, playlist) => status.is_playing && !status.item && status.context && status.context.uri.includes(playlist.id);

/**
 * Try to play Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 */
async function setPlay(teamId, channelId, userId) {
  try {
    const status = await fetchCurrentPlayback(teamId, channelId );

    // Spotify is already running
    if (status.is_playing && status.item) {
      return {success: false, response: PLAY_FAIL_RESPONSE.already, status: status};
    }
    const playlist = await loadPlaylist(teamId, channelId );

    // We have an empty playlist and status is IsPlaying
    if (noSongs(status, playlist)) {
      return {success: false, response: PLAY_FAIL_RESPONSE.empty, status: status};
    }

    // If we are playing from a spotify device already, just keep using it
    if (status.device) {
      return await attemptPlay(teamId, channelId, status.device.id, status, playlist, 0, userId);
    }

    // Load our default Device and fetch all available Spotify devices

    const [device, spotifyDevices] = await Promise.all([loadDefaultDevice(teamId, channelId), fetchDevices(teamId, channelId )]);

    if (device.id != NO_DEVICES) {
      // Default device selected
      if (spotifyDevices.devices.length == 0 || !spotifyDevices.devices.find(({id}) => id === device.id)) {
        // If selected devices is not turned on
        return {success: false, response: PLAY_FAIL_RESPONSE.no_device, status: status};
      }
      // Use our selected devices.
      return await attemptPlay(teamId, channelId, device.id, status, playlist, 0), userId;
    } else {
      // No default device selected -- Choose any available
      if (spotifyDevices.devices.length == 0) {
        // No devices available to use
        return {success: false, response: PLAY_FAIL_RESPONSE.no_devices, status: status};
      } else {
        // Use the first available device
        return await attemptPlay(teamId, channelId, spotifyDevices.devices[0].id, status, playlist, 0, userId);
      }
    }
  } catch (error) {
    logger.error(error);
  }
  return {success: false, response: PLAY_FAIL_RESPONSE.error, status: null};
};

/**
 * Recursive Retries to Play
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} deviceId
 * @param {Object} status
 * @param {Object} playlist
 * @param {Number} attempt
 * @param {string} userId
 */
async function attemptPlay(teamId, channelId, deviceId, status, playlist, attempt, userId) {
  if (attempt) {
    // Base Cases
    if (status.is_playing && status.item) {
      return {success: true, response: PLAY_RESPONSE.success(userId), status: status};
    }
    // We have an empty playlist and status is IsPlaying
    if (noSongs(status, playlist)) {
      return {success: false, response: PLAY_FAIL_RESPONSE.empty_playlist, status: status};
    }
    if (attempt == 2) {
      throw new PlaybackError();
    }
  }

  // Unique Spotify edge case where it gets stuck
  if (status && status.currently_playing_type=='unknown' && !status.context && !status.item) {
    await play(teamId, channelId, deviceId, playlist.uri);
  } else {
    await play(teamId, channelId, deviceId);
  }
  // Wait before verifying that Spotify is playing
  await sleep(100);
  const newStatus = await fetchCurrentPlayback(teamId, channelId );
  return await attemptPlay(teamId, channelId, deviceId, newStatus, playlist, attempt+1, userId);
}

module.exports = {
  setPlay,
};
