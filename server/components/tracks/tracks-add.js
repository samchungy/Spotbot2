

const config = require('config');
const logger = require('../../util/util-logger');
const moment = require('moment-timezone');

const {addTracksToPlaylist, deleteTracks, fetchPlaylistTotal, fetchTracks} = require('../spotify-api/spotify-api-playlists');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {play} = require('../spotify-api/spotify-api-playback');
const {fetchTrackInfo} = require('../spotify-api/spotify-api-tracks');
const {loadBackToPlaylist, loadPlaylist, loadProfile, loadRepeat, loadBackToPlaylistState, storeBackToPlaylistState} = require('../settings/settings-interface');
const {loadSearch, storeSearch} = require('../tracks/tracks-dal');
const {modelHistory} = require('../tracks/tracks-model');
const {sleep} = require('../../util/util-timeout');
const PlaylistTrack = require('../../util/util-spotify-playlist-track');
const Track = require('../../util/util-spotify-track');
const {loadBlacklist} = require('../settings/blacklist/blacklist-dal');
const LIMIT = config.get('spotify_api.playlists.tracks.limit');
const EXPIRY = Math.floor(Date.now() / 1000) + (30 * 24 * 60); // Current Time in Epoch + a month in seconds

const TRACK_ADD_RESPONSE = {
  blacklist: (title) => `:no_entry_sign: ${title} is blacklisted and cannot be added.`,
  error: ':warning: An error occured.',
  expired: ':information_source: Search has expired.',
  query_error: ':warning: Invalid query, please try again.',
  repeat: (title, timeAgo, repeatDuration) => `:no_entry_sign: ${title} was already added ${timeAgo}. Repeats are disabled for ${repeatDuration} hours in this channel's settings.`,
  success: (title) => `:tada: ${title} was added to the playlist.`,
  success_back: (title) => `:tada: ${title} was added to the playlist. Spotify will return back to the playlist after this song.`,
};

/**
 * Add a track to the Spotbot playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} trackUri
 */
async function addTrack(teamId, channelId, userId, trackUri) {
  try {
    const {country} = await loadProfile(teamId, channelId);
    const spotifyTrack = await fetchTrackInfo(teamId, channelId, country, trackUri.replace('spotify:track:', ''));
    const track = new Track(spotifyTrack);

    // Handle Blacklist
    const blacklist = await loadBlacklist(teamId, channelId);
    if (blacklist.find((trackB) => track.uri === trackB.uri)) {
      return TRACK_ADD_RESPONSE.blacklist(track.title);
    }

    const history = await loadSearch(teamId, channelId, track.uri);
    // Handle Repeats
    if (history && history.uri === track.uri) {
      const repeatDuration = await loadRepeat(teamId, channelId);
      if (moment(history.time).add(repeatDuration, 'hours').isAfter(moment())) {
        return TRACK_ADD_RESPONSE.repeat(track.title, moment(history.time).fromNow(), repeatDuration);
      }
    }

    const [backToPlaylist, playlist] = await Promise.all([loadBackToPlaylist(teamId, channelId), loadPlaylist(teamId, channelId)]);
    // Add to our playlist
    if (backToPlaylist === `true`) {
      const status = await fetchCurrentPlayback(teamId, channelId);
      if (status.is_playing && status.item && (!status.context || !status.context.uri.includes(playlist.id))) {
        // If Back to Playlist was not already called within the past 3 seconds
        const state = await loadBackToPlaylistState(teamId, channelId);
        if (!state || moment(state).add('2', 'seconds').isBefore(moment())) {
          // Tell Spotbot we are currently getting back to playlist, Remove any invalid tracks, Add current playing song + new track to playlist
          await Promise.all([storeBackToPlaylistState(teamId, channelId, Date.now()), removeInvalidTracks(teamId, channelId, playlist.id, country), addTracksToPlaylist(teamId, channelId, playlist.id, [status.item.uri, track.uri])]);
          // Save our history
          await Promise.all([storeSearch(teamId, channelId, track.uri, modelHistory(track.uri, userId, Date.now()), EXPIRY), setBackToPlaylist(teamId, channelId, playlist, status.item.uri, country)]);
          return TRACK_ADD_RESPONSE.success_back(track.title);
        } else {
          await sleep(2000); // Wait 2 seconds and then try again
          return await addTrack(teamId, channelId, userId, track.uris);
        }
      }
    }
    // Save history + add to playlist
    await Promise.all([storeSearch(teamId, channelId, track.uri, modelHistory(track.uri, userId, Date.now()), EXPIRY), addTracksToPlaylist(teamId, channelId, playlist.id, [track.uri])]);
    return TRACK_ADD_RESPONSE.success(track.title);
  } catch (error) {
    logger.error(error);
    return TRACK_ADD_RESPONSE.query_error;
  }
}

/**
 * Remove any invalid tracks from playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} playlistId
 * @param {string} country
 */
async function removeInvalidTracks(teamId, channelId, playlistId, country) {
  try {
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlistId);
    const promises = [];
    const attempts = Math.ceil(total/LIMIT);
    for (let offset=0; offset<attempts; offset++) {
      promises.push(new Promise(async (resolve) =>{
        const spotifyTracks = await fetchTracks(teamId, channelId, playlistId, country, offset*LIMIT);
        const tracksToDelete = [];
        spotifyTracks.items
            .map((track) => new PlaylistTrack(track))
            .forEach((track) => {
              if (!track.is_playable) {
                tracksToDelete.push({
                  uri: track.uri,
                });
              }
            });
        resolve(tracksToDelete);
      }));
    }
    const allTracksPromises = await Promise.all(promises);
    const allTracks = allTracksPromises.flat();
    for (let i = 0; i<Math.ceil(allTracks.length/LIMIT); i++) {
      await deleteTracks(teamId, channelId, playlistId, allTracks.slice((i)*LIMIT, (i+1)*LIMIT));
    }
  } catch (error) {
    logger.error('Removing invalid tracks failed');
    throw error;
  }
}

/**
 * Put spotify back onto the playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} playlist
 * @param {string} currentPlaying
 * @param {string} country
 */
async function setBackToPlaylist(teamId, channelId, playlist, currentPlaying, country) {
  try {
    // Find position of tracks we just added by searching from the end of playlist
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlist.id);
    const startIndex = Math.max(0, total-LIMIT);
    const tracks = await fetchTracks(teamId, channelId, playlist.id, null, startIndex);
    const trackNumber = (startIndex + tracks.items.length)-(1 + tracks.items.reverse().findIndex((track) => {
      return track.track.uri === currentPlaying;
    }));

    // Make another call to reduce the lag
    const status = await fetchCurrentPlayback(teamId, channelId, country);
    if (status && status.item && status.item.uri != currentPlaying) {
      // Just in case the track ends as we are trying to get back to playlist
      await play(teamId, channelId, status.device.id, playlist.uri, {position: trackNumber+1});
    } else {
      await play(teamId, channelId, status.device.id, playlist.uri, {position: trackNumber}, status.progress_ms);
    }
    await deleteTracks(teamId, channelId, playlist.id, [{
      uri: currentPlaying,
      positions: [trackNumber],
    }]);
  } catch (error) {
    logger.error('Setting back to playlist failed');
    throw error;
  }
}


module.exports = {
  addTrack,
  TRACK_ADD_RESPONSE,
};
