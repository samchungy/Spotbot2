const logger = require('/opt/utils/util-logger');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchDevices} = require('/opt/spotify/spotify-api-v2/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const {pause} = require('/opt/spotify/spotify-api-v2/spotify-api-playback');
const {isPlaying} = require('/opt/spotify/spotify-helper');

// Slack
const {post} = require('/opt/slack/slack-api');
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const RESPONSE = {
  success: (userId) => `:double_vertical_bar: Spotify was paused by <@${userId}>.`,
  no_devices: ':warning: Spotify is not open on any device.',
  already: ':information_source: Spotify is already paused.',
  failed: 'Pause failed',
};

const main = async (teamId, channelId, userId) => {
  const auth = await authSession(teamId, channelId);
  const spotifyDevices = await fetchDevices(auth);

  // No devices
  if (!spotifyDevices.devices.length) {
    const message = inChannelPost(channelId, RESPONSE.no_devices);
    return await post(message);
  }
  const status = await fetchCurrentPlayback(auth);

  // Check if Spotify is already paused
  if (!isPlaying(status)) {
    const message = inChannelPost(channelId, RESPONSE.already);
    return await post(message);
  }

  await pause(auth, status.device.id);

  // Check if actually paused
  const newStatus = await fetchCurrentPlayback(auth);
  if (isPlaying(newStatus)) {
    throw new Error('Failed to pause');
  }
  const message = inChannelPost(channelId, RESPONSE.success(userId));
  return await post(message);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, userId)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
