const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Fetches track info from Spotfiy
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} market
 * @param {string} trackId
 */
async function fetchTrackInfo(teamId, channelId, auth, market, trackId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
  return await requester(teamId, channelId, auth, `Get Track Info`, async () => {
    return (await spotifyApi.getTrack(trackId, {market: market})).body;
  });
}

/**
 * Fetches track info from Spotfiy
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} market
 * @param {Array} trackIds
 */
async function fetchTracksInfo(teamId, channelId, auth, market, trackIds) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
  return await requester(teamId, channelId, auth, `Get Track Info`, async () => {
    return (await spotifyApi.getTracks(trackIds, {market: market})).body;
  });
}

/**
 * Fetches artist tracks from Spotfiy
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} market
 * @param {string} artistId
 */
async function fetchArtistTracks(teamId, channelId, auth, market, artistId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
  return await requester(teamId, channelId, auth, `Get Artist Tracks`, async () => {
    return (await spotifyApi.getArtistTopTracks(artistId, market)).body;
  });
}


module.exports = {
  fetchArtistTracks,
  fetchTrackInfo,
  fetchTracksInfo,
};
