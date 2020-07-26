const logger = require('/opt/utils/util-logger');

// Spotify
const authSession = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchDevices} = require('/opt/spotify/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {pause} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {isPlaying} = require('/opt/spotify/spotify-helper');

// Util
const {sleep} = require('/opt/utils/util-timeout');

// Slack
const {post} = require('/opt/slack/slack-api');
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const PAUSE_RESPONSE = {
  success: (userId) => `:double_vertical_bar: Spotify was paused by <@${userId}>.`,
  no_devices: ':warning: Spotify is not open on any device.',
  already: ':information_source: Spotify is already paused.',
  failed: 'Pause failed',
};

const startPause = async (teamId, channelId, settings, userId) => {
  const auth = await authSession(teamId, channelId);
  const [status, spotifyDevices] = await Promise.all([
    fetchCurrentPlayback(teamId, channelId, auth),
    fetchDevices(teamId, channelId, auth),
  ]);

  // No devices
  if (!spotifyDevices.devices.length) {
    const message = inChannelPost(channelId, PAUSE_RESPONSE.no_devices);
    return await post(message);
  }

  // Check if Spotify is already paused
  if (!isPlaying(status)) {
    const message = inChannelPost(channelId, PAUSE_RESPONSE.already);
    return await post(message);
  }

  await pause(teamId, channelId, auth, status.device.id);
  await sleep(2500);

  // Check if actually paused
  const newStatus = await fetchCurrentPlayback(teamId, channelId, auth);
  if (isPlaying(newStatus)) {
    throw new Error('Failed to pause');
  }
  const message = inChannelPost(channelId, PAUSE_RESPONSE.success(userId));
  return await post(message);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId} = JSON.parse(event.Records[0].Sns.Message);
  await startPause(teamId, channelId, settings, userId)
      .catch((error)=>{
        logger.error(error, PAUSE_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, PAUSE_RESPONSE.failed);
      });
};
