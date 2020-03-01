const logger = require(process.env.LOGGER);
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchDevices} = require('/opt/spotify/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {sleep} = require('/opt/utils/util-timeout');
const {pause} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {responseUpdate} = require('/opt/control-panel/control-panel');

const PAUSE_RESPONSE = {
  success: (userId) => `:double_vertical_bar: Spotify was paused by <@${userId}>.`,
  no_devices: ':warning: Spotify is not open on any device.',
  already: ':information_source: Spotify is already paused.',
  error: ':warning: An error occured.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const auth = await authSession(teamId, channelId);
    const [status, spotifyDevices] = await Promise.all([fetchCurrentPlayback(teamId, channelId, auth), fetchDevices(teamId, channelId, auth)]);

    if (!spotifyDevices.devices.length) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, PAUSE_RESPONSE.no_devices, status);
    }
    // Check if Spotify is already paused
    if (!status.is_playing) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, PAUSE_RESPONSE.already, status);
    }

    // Try Pause
    await pause(teamId, channelId, auth, status.device.id);
    await sleep(500);
    const newStatus = await fetchCurrentPlayback(teamId, channelId, auth);
    if (!newStatus.is_playing) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, true, PAUSE_RESPONSE.success(userId), newStatus);
    }
    return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, PAUSE_RESPONSE.error, null);
  } catch (error) {
    logger.error('Control pause failed');
    logger.error(error);
    try {
      const auth = await authSession(teamId, channelId);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, PAUSE_RESPONSE.error, null);
    } catch (error) {
      logger.error('Reporting back to Slack failed');
      logger.error(error);
    }
  }
};
