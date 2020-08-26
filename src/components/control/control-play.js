const sns = require('/opt/sns');
const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {play} = require('/opt/spotify/spotify-api-v2/spotify-api-playback');
const {fetchDevices} = require('/opt/spotify/spotify-api-v2/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const {fetchPlaylistTotal} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const {isPlaying} = require('/opt/spotify/spotify-helper');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

// Slack
const {post, reply} = require('/opt/slack/slack-api');
const {inChannelPost, deleteReply} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const {sleep} = require('/opt/utils/util-timeout');

// Tracks
const {findTrackIndex} = require('../tracks/layers/find-index');
const {removeUnplayable} = require('../tracks/layers/remove-unplayable');

const NO_DEVICES = config.dynamodb.settings_helper.no_devices;
const DEFAULT_DEVICE = config.dynamodb.settings.default_device;
const PLAYLIST = config.dynamodb.settings.playlist;
const TRACKS_CURRENT = process.env.SNS_PREFIX + 'tracks-current';

const RESPONSE = {
  already: (vol) => `:information_source: Spotify is already playing. Spotify's volume is currently set at ${vol}%. Check if the speaker is muted.`,
  empty: ':information_source: Playlist is empty. Please add songs to the playlist.',
  no_default: ':warning: Spotify is not open on the default device listed in the settings. Attempting to play from the next available device.',
  no_devices: ':warning: Spotify is not open on any device.',
  success: (user) => `:arrow_forward: Spotify is now playing. Started by <@${user}>.`,
  success_track: (title, user) => `:arrow_forward: Spotify is now playing ${title} from the playlist. Started by <@${user}>.`,
  no_track: ':warning: Could not play the selected track from the playlist. Please try again.',
  failed: 'Play Failed',
};

const getCurrent = async (teamId, channelId, settings) => {
  const params = {
    Message: JSON.stringify({teamId, channelId, settings}),
    TopicArn: TRACKS_CURRENT,
  };
  await sns.publish(params).promise();
};

const playWithDevice = async (teamId, channelId, auth, deviceId, status, playlist, attempt, userId, settings, trackUri) => {
  if (attempt) {
    if (isPlaying(status)) {
      if (trackUri) {
        const statusTrack = new Track(status.item);
        if (statusTrack.uri === trackUri) {
          const message = inChannelPost(channelId, RESPONSE.success_track(statusTrack.title, userId));
          return await post(message);
        }
      } else if (status.currently_playing_type !== 'unknown') {
        // We have an empty playlist and status is IsPlaying -edge case where Spotify is stuck
        const message = inChannelPost(channelId, RESPONSE.success(userId));
        return await Promise.all([
          post(message),
          getCurrent(teamId, channelId, settings),
        ]);
      }
      const {total} = await fetchPlaylistTotal(auth, playlist.id);
      if (!total) {
        const message = inChannelPost(channelId, RESPONSE.empty);
        return await post(message);
      }
    }
    if (attempt === 2) {
      throw new Error('Max attempts to play reached');
    }
  }
  // Unique Spotify edge case where it gets stuck
  if (trackUri) {
    await removeUnplayable(auth, playlist.id);
    const index = await findTrackIndex(auth, playlist.id, auth.getProfile().country, trackUri).catch(() => false);
    if (index === false) {
      const message = inChannelPost(channelId, RESPONSE.no_track);
      return await post(message);
    }
    await play(auth, deviceId, playlist.uri, {position: index});
  } else {
    if (status && !status.item && status.currently_playing_type === 'unknown') {
      await play(auth, deviceId, playlist.uri);
    } else {
      await play(auth, deviceId);
    }
  }
  await sleep(1000);
  const newStatus = await fetchCurrentPlayback(auth, auth.getProfile().country);
  return await playWithDevice(teamId, channelId, auth, deviceId, newStatus, playlist, attempt+1, userId, settings, trackUri);
};

const main = async (teamId, channelId, settings, userId, responseUrl, trackUri) => {
  if (responseUrl) {
    const msg = deleteReply('', null);
    reply(msg, responseUrl).catch(logger.error);
  }
  const playlist = settings[PLAYLIST];
  const device = settings[DEFAULT_DEVICE];
  const auth = await authSession(teamId, channelId);
  const status = await fetchCurrentPlayback(auth);

  // Spotify is already running
  if (!trackUri && isPlaying(status)) {
    const message = inChannelPost(channelId, RESPONSE.already(status.device.volume_percent));
    return await post(message);
  }
  // If we are playing from a spotify device already, just keep using it
  if (status.device) {
    return await playWithDevice(teamId, channelId, auth, status.device.id, status, playlist, 0, userId, settings, trackUri);
  }
  // See if our default device from settings is currently online
  const spotifyDevices = await fetchDevices(auth);
  if (!spotifyDevices.devices.length) {
    const message = inChannelPost(channelId, RESPONSE.no_devices);
    return await post(message);
  }
  // Use our selected devices.
  if (spotifyDevices.devices.find(({id}) => id === device.id)) {
    return await playWithDevice(teamId, channelId, auth, device.id, status, playlist, 0, userId, settings, trackUri);
  }
  if (device.id !== NO_DEVICES) {
    const message = inChannelPost(channelId, RESPONSE.no_default);
    post(message).catch(logger.error);
  }
  return await playWithDevice(teamId, channelId, auth, spotifyDevices.devices[0].id, status, playlist, 0, userId, settings, trackUri);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, responseUrl, trackUri} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, settings, userId, responseUrl, trackUri)
      .catch(async (error)=>{
        logger.error(error, RESPONSE.failed);
        await reportErrorToSlack(channelId, null, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
