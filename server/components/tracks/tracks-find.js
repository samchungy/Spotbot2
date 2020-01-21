const {fetchSearchTracks} = require('../spotify-api/spotify-api-search');
const {loadProfile} = require('../settings/settings-dal');
const logger = require('pino')();
const config = require('config');
const Track = require('../../util/util-spotify-track');
const TRACK = config.get('slack.responses.tracks');
const LIMIT = config.get('spotify_api.tracks.limit'); // 24 Search results = 8 pages.


/**
 * Find tracks from Spotify and store them in our database.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} query
 */
async function findAndStore(teamId, channelId, query) {
  try {
    if (!isValidQuery(query)) {
      return {success: false, response: TRACK.query.error};
    }
    const profile = await loadProfile(teamId, channelId);
    const tracks = await fetchSearchTracks(teamId, channelId, query, profile.country, LIMIT);
    if (tracks.items.length == 0) {
      return {success: false, response: TRACK.no_tracks};
    }
    await storeTracks(teamId, channelId, tracks.items.map((track) => new Track(track)));
  } catch (error) {
    return {success: false, response: TRACK.error};
  }
};

/**
 * Checks if the query is valid
 * @param {string} query
 */
async function isValidQuery(query) {
  // Query's are not allowed to contain more than 1 wildcard, as we append a wildcard at the end
  return ((query.match(/\*/g)||[]).length > 1 || query.match(/".*."/gs));
}

module.exports = {
  findAndStore,
};
