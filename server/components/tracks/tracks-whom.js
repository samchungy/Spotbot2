const logger = require('../../util/util-logger');
const config = require('config');
const moment = require('moment-timezone');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {fetchUserProfile} = require('../spotify-api/spotify-api-profile');
const {fetchPlaylistTotal, fetchTracks} = require('../spotify-api/spotify-api-playlists');
const {loadProfile, loadPlaylist} = require('../settings/settings-interface');
const {loadSearch} = require('../tracks/tracks-dal');
const {getCurrentInfo} = require('./tracks-current');
const {inChannelPost} = require('../slack/format/slack-format-reply');
const {post} = require('../slack/slack-api');
const Track = require('../../util/util-spotify-track');
const PlaylistTrack = require('../../util/util-spotify-playlist-track');
const LIMIT = config.get('spotify_api.playlists.tracks.limit');
const WHOM_RESPONSE = {
  now_playing_direct: (title, user, time) => `:microphone: ${title} was added directly to the playlist in Spotify ${time} by ${user}.`,
  now_playing: (title, user, time) => `:microphone: ${title} was added was last added ${time} by ${user}.`,
  response: (track) => `:microphone: ${track.title} is playing because Spotbot is returning to the playlist. The next song will be back on the playlist.`,
};

/**
 * Get Whomever requested a song
 * @param {string} teamId
 * @param {string} channelId
 */
async function getWhom(teamId, channelId) {
  try {
    let text;
    const profile = await loadProfile(teamId, channelId);
    const status = await fetchCurrentPlayback(teamId, channelId, profile.country);
    if (status.item && status.is_playing) {
      const track = new Track(status.item);
      const playlist = await loadPlaylist(teamId, channelId);
      if (status.context && status.context.uri.includes(playlist.id)) {
        const playlistTrack = await getTrack(teamId, channelId, playlist.id, profile.country, track.uri);
        if (playlistTrack) {
          const userProfile = await fetchUserProfile(teamId, channelId, playlistTrack.addedBy.id);
          if (playlistTrack.addedBy.id === profile.id) {
            // This track was added through Spotbot
            const history = await loadSearch(teamId, channelId, track.uri);
            if (!history) {
              text = WHOM_RESPONSE.now_playing_direct(track.title, `<${userProfile.external_urls.spotify}|${userProfile.display_name ? userProfile.display_name : userProfile.id}>`, moment(playlistTrack.addedAt).fromNow());
            } else {
              text = WHOM_RESPONSE.now_playing(track.title, `<@${history.userId}>`, moment(history.time).fromNow());
            }
          } else {
            text = WHOM_RESPONSE.now_playing_direct(track.title, `<${userProfile.external_urls.spotify}|${userProfile.display_name ? userProfile.display_name : userProfile.id}>`, moment(playlistTrack.addedAt).fromNow());
          }
        } else {
          text = WHOM_RESPONSE.response(track);
        }
      } else {
        return await getCurrentInfo(teamId, channelId);
      }
    } else {
      return await getCurrentInfo(teamId, channelId);
    }
    await post(
        inChannelPost(channelId, text, null),
    );
  } catch (error) {
    logger.error('Get Whom failed');
    throw error;
  }
}

/**
 * Get Track Position
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} playlistId
 * @param {string} country
 * @param {string} trackUri
 */
async function getTrack(teamId, channelId, playlistId, country, trackUri) {
  try {
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlistId);
    const attempts = Math.ceil(total/LIMIT);
    // Find track from back to front
    for (let offset = attempts-1; offset >=0; offset--) {
      const spotifyTracks = await fetchTracks(teamId, channelId, playlistId, country, offset*LIMIT);
      const track = spotifyTracks.items
          .map((track) => new PlaylistTrack(track))
          .reverse()
          .find((track) => track.uri === trackUri);
      if (track) {
        return track;
      }
    }
    return null;
  } catch (error) {
    logger.error('Get Track failed');
    throw error;
  }
}

module.exports = {
  getWhom,
}
;
