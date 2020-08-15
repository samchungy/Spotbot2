const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');
const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');
const {fetchTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');

const LIMIT = config.spotify_api.playlists.tracks.limit;

/**
 * Get tracks to review (Tracks added less than half an hour ago)
 * @param {Object} auth
 * @param {Object} playlist
 * @param {Number} total
 */
const getReviewTracks = async (auth, playlist, total) => {
  try {
    const timeBefore = moment().subtract(30, 'minutes');
    const offset = Math.max(0, total-LIMIT);
    const spotifyTracks = await fetchTracks(auth, playlist.id, null, offset);
    const playlistTracks = spotifyTracks.items.map((track) => new PlaylistTrack(track)).reverse();
    const reviewTracks = playlistTracks.reduce((review, track) => {
      if (moment(track.addedAt).isAfter(timeBefore)) {
        review.push(track);
      }
      return review;
    }, []);
    return reviewTracks;
  } catch (error) {
    logger.error('Getting Review Tracks failed.');
    throw error;
  }
};

module.exports = {
  getReviewTracks,
};
