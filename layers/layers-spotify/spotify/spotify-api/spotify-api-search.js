const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Find Search Tracks
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} query
 * @param {string} market
 * @param {Number} limit
 * @param {Number} offset
 */
async function fetchSearchTracks(teamId, channelId, auth, query, market, limit) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
  return await requester(teamId, channelId, auth, `Find Search Tracks: "${query}"`, async () => {
    return (await spotifyApi.searchTracks(query, {
      market: market,
      limit: limit,
    })).body;
  });
}

/**
 * Find Artists
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} query
 * @param {string} market
 * @param {Number} limit
 * @param {Number} offset
 */
async function fetchArtists(teamId, channelId, auth, query, market, limit) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
  return await requester(teamId, channelId, auth, `Get Artists`, async () => {
    return (await spotifyApi.searchArtists(query, {
      market: market,
      limit: limit,
    })).body;
  });
}

module.exports = {
  fetchArtists,
  fetchSearchTracks,
};
