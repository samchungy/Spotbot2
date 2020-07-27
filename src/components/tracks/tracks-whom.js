const sns = require('/opt/sns');

const logger = require('/opt/utils/util-logger');
const config = require('/opt/config/config');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');

// Spotify
const authSession = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const {fetchUserProfile} = require('/opt/spotify/spotify-api-v2/spotify-api-profile');
const {fetchPlaylistTotal, fetchTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const {onPlaylist, isPlaying} = require('/opt/spotify/spotify-helper');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');

// Slack
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {post} = require('/opt/slack/slack-api');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// History
const {loadTrackHistory} = require('/opt/db/history-interface');

// Blacklist
const {onBlacklist} = require('/opt/control-skip/control-skip');

// Constants
const TRACKS_CURRENT = process.env.SNS_PREFIX + 'tracks-current';
const LIMIT = config.spotify_api.playlists.tracks.limit;
const PLAYLIST = config.dynamodb.settings.playlist;

const WHOM_RESPONSE = {
  error: `:warning: An error occured. Please try again.`,
  failed: 'Finding whom failed',
  not_playing: ':information_source: Spotify is currently not playing. Use `/control` or `/play` to play Spotbot.',
  now_playing_direct: (title, user, time) => `:microphone: ${title} was added directly to the playlist from Spotify ${time} by ${user}.`,
  now_playing: (title, user, time) => `:microphone: ${title} was added was last added ${time} by ${user}.`,
  returning: (playlist) => `:information_source: Spotbot is returning to the Spotbot playlist: ${playlist} or was recently deleted.`,
};

/**
 * Get Track and Position
 * @param {object} auth
 * @param {string} playlistId
 * @param {string} country
 * @param {string} trackId
 */
const getTrack = async (auth, playlistId, country, trackId) => {
  const {total} = await fetchPlaylistTotal(auth, playlistId);
  const attempts = Math.ceil(total/LIMIT);
  // Find track from back to front
  for (let offset = attempts-1; offset >=0; offset--) {
    const spotifyTracks = await fetchTracks(auth, playlistId, country, offset*LIMIT);
    const track = spotifyTracks.items
        .map((track) => new PlaylistTrack(track))
        .reverse()
        .find((track) => track.id === trackId);
    if (track) {
      return track;
    }
  }
  return null;
};

/**
 * Launches /current lambda
 * @param {string} teamId
 * @param {string} channelId
 * @param {object} settings
 * @param {string} userId
 */
const getCurrentInfo = async (teamId, channelId, settings, userId) => {
  const params = {
    Message: JSON.stringify({teamId, channelId, settings, userId}),
    TopicArn: TRACKS_CURRENT,
  };
  return await sns.publish(params).promise();
};

const getWhom = async (teamId, channelId, settings) => {
  const playlist = settings[PLAYLIST];
  const auth = await authSession(teamId, channelId);
  const profile = auth.getProfile();
  const status = await fetchCurrentPlayback(auth, profile.country);

  if (!isPlaying(status)) {
    const message = inChannelPost(channelId, WHOM_RESPONSE.not_playing, null);
    return await post(message);
  }
  const statusTrack = new Track(status.item);

  // Check Blacklist for song
  if (await onBlacklist(teamId, channelId, auth, settings, playlist, status, statusTrack)) {
    return;
  }

  if (onPlaylist(status, playlist)) {
    const playlistTrack = await getTrack(auth, playlist.id, profile.country, statusTrack.id);
    if (playlistTrack) {
      // On Playlist
      if (playlistTrack.addedBy.id === profile.id) {
        // Check if it is our account which added it
        const history = await loadTrackHistory(teamId, channelId, statusTrack.id);
        if (history) {
          const message = inChannelPost(channelId, WHOM_RESPONSE.now_playing(statusTrack.title, `<@${history.userId}>`, moment.unix(history.timeAdded).fromNow()), null);
          return await post(message);
        }
      }
      // Was added direct
      const userProfile = await fetchUserProfile(auth, playlistTrack.addedBy.id);
      const message = inChannelPost(channelId, WHOM_RESPONSE.now_playing_direct(statusTrack.title, `<${userProfile.external_urls.spotify}|${userProfile.display_name ? userProfile.display_name : userProfile.id}>`, moment(playlistTrack.addedAt).fromNow()), null);
      return await post(message);
    }
  }
  return getCurrentInfo(teamId, channelId, settings);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings} = JSON.parse(event.Records[0].Sns.Message);
  await getWhom(teamId, channelId, settings)
      .catch((error)=>{
        logger.error(error, WHOM_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, WHOM_RESPONSE.failed);
      });
};
