const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Hits play on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} query
 * @param {string} market
 * @param {Number} limit
 * @param {Number} offset
 */
async function fetchSearchTracks(teamId, channelId, query, market, limit) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return await requester(`Find Search Tracks: "${query}"`, async () => {
    return (await spotifyApi.searchTracks(query, {
      market: market,
      limit: limit,
    })).body;
  });
}

module.exports = {
  fetchSearchTracks,
};
