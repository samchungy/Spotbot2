const sns = require('/opt/sns');
const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {play} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {fetchDevices} = require('/opt/spotify/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {fetchPlaylistTotal} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {isPlaying} = require('/opt/spotify/spotify-helper');

// Util
const {sleep} = require('/opt/utils/util-timeout');

// Slack
const {post} = require('/opt/slack/slack-api');
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const NO_DEVICES = config.dynamodb.settings_helper.no_devices;
const DEFAULT_DEVICE = config.dynamodb.settings.default_device;
const PLAYLIST = config.dynamodb.settings.playlist;
const TRACKS_CURRENT = process.env.SNS_PREFIX + 'tracks-current';

const PLAY_RESPONSE = {
  already: ':information_source: Spotify is already playing. Check if the speaker is muted.',
  empty: ':information_source: Playlist is empty. Please add songs to the playlist.',
  no_device: ':warning: Spotify is not open on the default device listed in the settings.',
  no_devices: ':warning: Spotify is not open on any device.',
  success: (user) => `:arrow_forward: Spotify is now playing. Started by <@${user}>.`,
  failed: 'Play Failed',
};

const getCurrent = async (teamId, channelId, settings) => {
  const params = {
    Message: JSON.stringify({teamId, channelId, settings}),
    TopicArn: TRACKS_CURRENT,
  };
  await sns.publish(params).promise();
};

const playWithDevice = async (teamId, channelId, auth, deviceId, status, playlist, attempt=0, userId, settings) => {
  if (attempt) {
    if (isPlaying(status) && status.currently_playing_type !== 'unknown') {
      const message = inChannelPost(channelId, PLAY_RESPONSE.success(userId));
      return await Promise.all([
        post(message),
        getCurrent(teamId, channelId, settings),
      ]);
    }
    if (attempt === 2) {
      throw new Error();
    }
  }
  // Unique Spotify edge case where it gets stuck
  if (status && !status.item && status.currently_playing_type === 'unknown') {
    await play(teamId, channelId, auth, deviceId, playlist.uri);
  } else {
    await play(teamId, channelId, auth, deviceId);
  }
  // Wait before verifying that Spotify is playing
  await sleep(2000);
  const newStatus = await fetchCurrentPlayback(teamId, channelId, auth);
  return await playWithDevice(teamId, channelId, auth, deviceId, newStatus, playlist, attempt+1, userId, settings);
};

const startPlay = async (teamId, channelId, settings, userId) => {
  const playlist = settings[PLAYLIST];
  const device = settings[DEFAULT_DEVICE];
  const auth = await authSession(teamId, channelId);
  const status = await fetchCurrentPlayback(teamId, channelId, auth);

  // Spotify is already running
  if (isPlaying(status)) {
    const message = inChannelPost(channelId, PLAY_RESPONSE.already);
    return await post(message);
  }
  // We have an empty playlist and status is IsPlaying -edge case where Spotify is stuck
  const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, auth, playlist.id);
  if (!total) {
    const message = inChannelPost(channelId, PLAY_RESPONSE.empty);
    return await post(message);
  }
  // If we are playing from a spotify device already, just keep using it
  if (status.device) {
    return await playWithDevice(teamId, channelId, auth, status.device.id, status, playlist, 0, userId, settings);
  }
  // See if our default device from settings is currently online
  const spotifyDevices = await fetchDevices(teamId, channelId, auth);
  if (device.id != NO_DEVICES) {
    // Our selected devices is not turned on
    if (spotifyDevices.devices.length == 0 || !spotifyDevices.devices.find(({id}) => id === device.id)) {
      const message = inChannelPost(channelId, PLAY_RESPONSE.no_device);
      return await post(message);
    }
    // Use our selected devices.
    return await playWithDevice(teamId, channelId, auth, device.id, status, playlist, 0, userId, settings);
  } else {
    // No default device selected -- Choose any available
    if (!spotifyDevices.devices.length) {
      // No devices available to use
      const message = inChannelPost(channelId, PLAY_RESPONSE.no_devices);
      return await post(message);
    } else {
      // Use the first available device
      return await attemptPlay(teamId, channelId, auth, spotifyDevices.devices[0].id, status, playlist, 0, userId, settings);
    }
  }
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId} = JSON.parse(event.Records[0].Sns.Message);
  await startPlay(teamId, channelId, settings, userId)
      .catch((error)=>{
        logger.error(error, PLAY_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, PLAY_RESPONSE.failed);
      });
};
