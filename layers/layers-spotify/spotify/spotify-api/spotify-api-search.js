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
const fetchSearchTracks = async (teamId, channelId, auth, query, market, limit) => {
  return await requester(teamId, channelId, auth, `Find Search Tracks: "${query}"`, async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
    return spotifyApi.searchTracks(query, {
      market: market,
      limit: limit,
    }).then((data) => data.body);
  });
};

/**
 * Find Artists
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} query
 * @param {string} market
 * @param {Number} limit
 * @param {Number} offset
 * @return {Promise}
 */
const fetchArtists = async (teamId, channelId, auth, query, market, limit) => {
  return await requester(teamId, channelId, auth, `Get Artists`, async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
    return spotifyApi.searchArtists(query, {
      market: market,
      limit: limit,
    }).then((data) => data.body);
  });
};

module.exports = {
  fetchArtists,
  fetchSearchTracks,
};
