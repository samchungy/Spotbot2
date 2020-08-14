const sns = require('/opt/sns');
const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {play} = require('/opt/spotify/spotify-api-v2/spotify-api-playback');
const {fetchDevices} = require('/opt/spotify/spotify-api-v2/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const {fetchPlaylistTotal, fetchTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const {isPlaying} = require('/opt/spotify/spotify-helper');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');

// Slack
const {post, reply} = require('/opt/slack/slack-api');
const {inChannelPost, deleteReply} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const {sleep} = require('/opt/utils/util-timeout');

const NO_DEVICES = config.dynamodb.settings_helper.no_devices;
const DEFAULT_DEVICE = config.dynamodb.settings.default_device;
const PLAYLIST = config.dynamodb.settings.playlist;
const LIMIT = config.spotify_api.playlists.tracks.limit;
const TRACKS_CURRENT = process.env.SNS_PREFIX + 'tracks-current';

const RESPONSE = {
  already: (vol) => `:information_source: Spotify is already playing. Spotify's volume is currently set at ${vol}%. Check if the speaker is muted.`,
  empty: ':information_source: Playlist is empty. Please add songs to the playlist.',
  no_device: ':warning: Spotify is not open on the default device listed in the settings. Attempting to play from the next available device.',
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

const playWithDevice = async (teamId, channelId, auth, deviceId, status, playlist, attempt=0, userId, settings, index) => {
  if (attempt) {
    if (isPlaying(status) && status.currently_playing_type !== 'unknown') {
      const message = inChannelPost(channelId, RESPONSE.success(userId));
      return await Promise.all([
        post(message),
        getCurrent(teamId, channelId, settings),
      ]);
    }
    // We have an empty playlist and status is IsPlaying -edge case where Spotify is stuck
    if (isPlaying(status)) {
      const {total} = await fetchPlaylistTotal(auth, playlist.id);
      if (!total) {
        const message = inChannelPost(channelId, RESPONSE.empty);
        return await post(message);
      }
    }
    if (attempt === 2) {
      throw new Error();
    }
  }
  // Unique Spotify edge case where it gets stuck
  if (index) {
    await play(auth, deviceId, playlist.uri, {position: index});
  } else {
    if (status && !status.item && status.currently_playing_type === 'unknown') {
      await play(auth, deviceId, playlist.uri);
    } else {
      await play(auth, deviceId);
    }
  }
  await sleep(1000);
  const newStatus = await fetchCurrentPlayback(auth);
  return await playWithDevice(teamId, channelId, auth, deviceId, newStatus, playlist, attempt+1, userId, settings);
};

const main = async (teamId, channelId, settings, userId, responseUrl, trackUri) => {
  if (responseUrl) {
    const msg = deleteReply('', null);
    reply(msg, responseUrl);
  }
  const playlist = settings[PLAYLIST];
  const device = settings[DEFAULT_DEVICE];
  const auth = await authSession(teamId, channelId);
  const index = trackUri ? await findTrackIndex(auth, playlist.id, auth.getProfile().country, trackUri) : null;
  const status = await fetchCurrentPlayback(auth);

  // Spotify is already running
  if (!trackUri && isPlaying(status)) {
    const message = inChannelPost(channelId, RESPONSE.already(status.device.volume_percent));
    return await post(message);
  }
  // If we are playing from a spotify device already, just keep using it
  if (status.device) {
    return await playWithDevice(teamId, channelId, auth, status.device.id, status, playlist, 0, userId, settings, index);
  }
  // See if our default device from settings is currently online
  const spotifyDevices = await fetchDevices(auth);
  if (device.id != NO_DEVICES) {
    // Our selected devices is not turned on
    if (spotifyDevices.devices.length == 0 || !spotifyDevices.devices.find(({id}) => id === device.id)) {
      const message = inChannelPost(channelId, RESPONSE.no_device);
      await post(message);
    }
    // Use our selected devices.
    return await playWithDevice(teamId, channelId, auth, device.id, status, playlist, 0, userId, settings, index);
  }

  // No default device selected -- Choose any available
  if (!spotifyDevices.devices.length) {
    // No devices available to use
    const message = inChannelPost(channelId, RESPONSE.no_devices);
    return await post(message);
  } else {
    // Use the first available device
    return await playWithDevice(teamId, channelId, auth, spotifyDevices.devices[0].id, status, playlist, 0, userId, settings, index);
  }
};

const findTrackIndex = async (auth, playlistId, country, trackUri) => {
  // Find what track number we just added
  const {total} = await fetchPlaylistTotal(auth, playlistId);
  const offset = Math.max(0, total-LIMIT);
  const playlistTracks = await fetchTracks(auth, playlistId, country, offset, LIMIT);
  const index = Math.max(0, playlistTracks.items.length-1) - playlistTracks.items.reverse().findIndex((ptrack) => {
    const playlistTrack = new PlaylistTrack(ptrack);
    return trackUri === playlistTrack.uri;
  });
  return index;
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, responseUrl, trackUri} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, settings, userId, responseUrl, trackUri)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, RESPONSE.failed);
      });
};
