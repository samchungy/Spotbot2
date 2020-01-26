

const config = require('config');
const logger = require('pino')();
const moment = require('moment-timezone');

const {addTracksToPlaylist, deleteTracks, fetchPlaylistTotal, fetchTracks} = require('../spotify-api/spotify-api-playlists');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {play} = require('../spotify-api/spotify-api-playback');
const {fetchTrackInfo} = require('../spotify-api/spotify-api-tracks');
const {loadBackToPlaylist, loadPlaylistSetting, loadProfile, loadRepeat} = require('../settings/settings-dal');
const {loadTrackSearch, storeTrackSearch} = require('../tracks/tracks-dal');
const {modelHistory} = require('../tracks/tracks-model');
const PlaylistTrack = require('../../util/util-spotify-playlist-track');
const Track = require('../../util/util-spotify-track');
const TRACKS = config.get('slack.responses.tracks');
const LIMIT = config.get('spotify_api.playlists.tracks.limit');
const EXPIRY = Math.floor(Date.now() / 1000) + (30 * 24 * 60); // Current Time in Epoch + a month in seconds
const repeatMessage = (title, timeAgo, repeatDuration) => `:no_entry_sign: ${title} was already added ${timeAgo}. Repeats are disabled for ${repeatDuration} hours in this channel's settings.`;
const successMessage = (title) => `:tada: ${title} was added to the playlist.`;
const successBackMessage = (title) => `:tada: ${title} was added to the playlist. Spotify will return back to the playlist after this song.`;


/**
 * Add a track to the Spotbot playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} trackUri
 */
async function addTrack(teamId, channelId, userId, trackUri) {
  try {
    const [{country}, repeatDuration, history] = await Promise.all([loadProfile(teamId, channelId), loadRepeat(teamId, channelId), loadTrackSearch(teamId, channelId, trackUri)]);
    const spotifyTrack = await fetchTrackInfo(teamId, channelId, country, trackUri.replace('spotify:track:', ''));
    const track = new Track(spotifyTrack);

    // Handle Repeats
    if (history && history.uri === trackUri) {
      if (moment(history.time).add(repeatDuration, 'hours').isAfter(moment())) {
        return repeatMessage(track.title, moment(history.time).fromNow(), repeatDuration);
      }
    }

    // Add to our playlist
    const [backToPlaylist, playlist] = await Promise.all([loadBackToPlaylist(teamId, channelId), loadPlaylistSetting(teamId, channelId)]);

    if (backToPlaylist === `true`) {
      const status = await fetchCurrentPlayback(teamId, channelId);
      if (status.is_playing && status.item && (!status.context || !status.context.uri.includes(playlist.id))) {
        // Add current playing song + new track to playlist
        await removeInvalidTracks(teamId, channelId, playlist.id, country);
        await addTracksToPlaylist(teamId, channelId, playlist.id, [status.item.uri, trackUri]);
        await setBackToPlaylist(teamId, channelId, playlist, status.item.uri);
        await storeTrackSearch(teamId, channelId, trackUri, modelHistory(trackUri, userId, Date.now()), EXPIRY);
        return successBackMessage(track.title);
      }
    }
    await addTracksToPlaylist(teamId, channelId, playlist.id, [trackUri]);
    await storeTrackSearch(teamId, channelId, trackUri, modelHistory(trackUri, userId, Date.now()), EXPIRY);
    return successMessage(track.title);
  } catch (error) {
    logger.error(error);
    return TRACKS.error;
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
            .forEach((track, index) => {
              if (!track.is_playable) {
                tracksToDelete.push({
                  uri: track.uri,
                  positions: [index+(LIMIT*offset)],
                });
              }
            });
        resolve(tracksToDelete);
      }));
    }
    const allTracksPromises = await Promise.all(promises);
    const allTracks = allTracksPromises.flat();
    await deleteTracks(teamId, channelId, playlistId, allTracks);
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
 */
async function setBackToPlaylist(teamId, channelId, playlist, currentPlaying) {
  try {
    // Find position of tracks we just added by searching from the end of playlist
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlist.id);
    const tracks = await fetchTracks(teamId, channelId, playlist.id, null, Math.max(0, total-LIMIT));
    const trackNumber = tracks.items.length-(1 + tracks.items.reverse().findIndex((track) => {
      return track.track.uri === currentPlaying;
    }));

    // Make another call to reduce the lag
    const status = await fetchCurrentPlayback(teamId, channelId);
    await play(teamId, channelId, status.device.id, playlist.uri, {position: trackNumber}, status.progress_ms);
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
};
