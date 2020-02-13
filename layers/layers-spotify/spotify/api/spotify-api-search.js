const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Find Search Tracks
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} query
 * @param {string} market
 * @param {Number} limit
 * @param {Number} offset
 */
async function fetchSearchTracks(teamId, channelId, query, market, limit) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return await requester(teamId, channelId, `Find Search Tracks: "${query}"`, async () => {
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
 * @param {string} query
 * @param {string} market
 * @param {Number} limit
 * @param {Number} offset
 */
async function fetchArtists(teamId, channelId, query, market, limit) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return await requester(teamId, channelId, `Get Artists`, async () => {
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
