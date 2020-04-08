const moment = require(process.env.MOMENT);
const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');
const {fetchTracks} = require('/opt/spotify/spotify-api/spotify-api-playlists');

const LIMIT = config.spotify_api.playlists.tracks.limit;

/**
 * Get tracks to review (Tracks added less than half an hour ago)
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {Object} playlist
 * @param {Number} total
 */
async function getReviewTracks(teamId, channelId, auth, playlist, total) {
  try {
    const reviewTracks = [];
    const timeBefore = moment().subtract(30, 'minutes');
    const offset = Math.max(0, total-LIMIT);
    const spotifyTracks = await fetchTracks(teamId, channelId, auth, playlist.id, null, offset);
    const playlistTracks = spotifyTracks.items.map((track) => new PlaylistTrack(track)).reverse();
    for (track of playlistTracks) {
    // If it was added within the past half an hour
      if (moment(track.addedAt).isAfter(timeBefore)) {
        reviewTracks.push(track);
      } else {
        break;
      }
    }

    return reviewTracks;
  } catch (error) {
    logger.error('Getting Review Tracks failed.');
    throw error;
  }
}

module.exports = {
  getReviewTracks,
};
