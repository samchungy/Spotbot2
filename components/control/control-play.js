const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {responseUpdate} = require('/opt/control-panel/control-panel');
const {play} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {fetchDevices} = require('/opt/spotify/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {sleep} = require('/opt/utils/util-timeout');

const NO_DEVICES = config.dynamodb.settings_helper.no_devices;
const DEFAULT_DEVICE = config.dynamodb.settings.default_device;
const PLAYLIST = config.dynamodb.settings.playlist;

const PLAY_RESPONSE = {
  already: ':information_source: Spotify is already playing. Check if the speaker is muted.',
  empty: ':information_source: Playlist is empty. Please add songs to the playlist.',
  no_device: ':warning: Spotify is not open on your selected device.',
  no_devices: ':warning: Spotify is not open on any device.',
  error: ':warning: An error occured.',
  empty_playlist: ':information_source: Playlist is empty. Please add songs to the playlist.',
  success: (user) => `:arrow_forward: Spotify is now playing. Started by <@${user}>.`,
};
const noSongs = (status, playlist) => status.is_playing && !status.item && status.context && status.context.uri.includes(playlist.id);

/**
 * Recursive Retries to Play
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {Object} settings
 * @param {string} timestamp
 * @param {String} deviceId
 * @param {Object} status
 * @param {Object} playlist
 * @param {Number} attempt
 * @param {string} userId
 */
async function attemptPlay(teamId, channelId, auth, settings, timestamp, deviceId, status, playlist, attempt, userId) {
  if (attempt) {
    // Base Cases
    if (status.is_playing && status.item) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, true, PLAY_RESPONSE.success(userId), status);
    }
    // We have an empty playlist and status is IsPlaying
    if (noSongs(status, playlist)) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, PLAY_RESPONSE.empty_playlist, status);
    }
    if (attempt == 2) {
      throw new Error;
    }
  }

  // Unique Spotify edge case where it gets stuck
  if (status && status.currently_playing_type=='unknown' && !status.context && !status.item) {
    await play(teamId, channelId, auth, deviceId, playlist.uri);
  } else {
    await play(teamId, channelId, auth, deviceId);
  }
  // Wait before verifying that Spotify is playing
  await sleep(500);
  const newStatus = await fetchCurrentPlayback(teamId, channelId, auth);
  return await attemptPlay(teamId, channelId, auth, settings, timestamp, deviceId, newStatus, playlist, attempt+1, userId);
}

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const auth = await authSession(teamId, channelId);
    const status = await fetchCurrentPlayback(teamId, channelId, auth);

    // Spotify is already running
    if (status.is_playing && status.item) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, PLAY_RESPONSE.already, status);
    }
    const playlist = settings[PLAYLIST];

    // We have an empty playlist and status is IsPlaying
    if (noSongs(status, playlist)) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, PLAY_RESPONSE.empty, status);
    }

    // If we are playing from a spotify device already, just keep using it
    if (status.device) {
      return await attemptPlay(teamId, channelId, auth, settings, timestamp, status.device.id, status, playlist, 0, userId);
    }

    // Load our default Device and fetch all available Spotify devices
    const device = settings[DEFAULT_DEVICE];
    const spotifyDevices = await fetchDevices(teamId, channelId, auth);

    if (device.id != NO_DEVICES) {
      // Default device selected
      if (spotifyDevices.devices.length == 0 || !spotifyDevices.devices.find(({id}) => id === device.id)) {
        // If selected devices is not turned on
        return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, PLAY_RESPONSE.no_device, status);
      }
      // Use our selected devices.
      return await attemptPlay(teamId, channelId, auth, settings, timestamp, device.id, status, playlist, 0, userId);
    } else {
      // No default device selected -- Choose any available
      if (spotifyDevices.devices.length == 0) {
        // No devices available to use
        return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, PLAY_RESPONSE.no_devices, status);
      } else {
        // Use the first available device
        return await attemptPlay(teamId, channelId, auth, settings, timestamp, spotifyDevices.devices[0].id, status, playlist, 0, userId);
      }
    }
  } catch (error) {
    logger.error('Control play failed');
    logger.error(error);
    try {
      const auth = await authSession(teamId, channelId);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, PLAY_RESPONSE.error, null);
    } catch (error) {
      logger.error('Reporting back to Slack failed');
      logger.error(error);
    }
  }
};
