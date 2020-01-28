const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Fetches track info from Spotfiy
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} market
 * @param {string} trackId
 */
async function fetchTrackInfo(teamId, channelId, market, trackId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return await requester(teamId, channelId, `Get Track Info`, async () => {
    return (await spotifyApi.getTrack(trackId, {market: market})).body;
  });
}

/**
 * Fetches track info from Spotfiy
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} market
 * @param {Array} trackIds
 */
async function fetchTracksInfo(teamId, channelId, market, trackIds) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return await requester(teamId, channelId, `Get Track Info`, async () => {
    return (await spotifyApi.getTracks(trackIds, {market: market})).body;
  });
}

/**
 * Fetches artist tracks from Spotfiy
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} market
 * @param {string} artistId
 */
async function fetchArtistTracks(teamId, channelId, market, artistId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return await requester(teamId, channelId, `Get Artist Tracks`, async () => {
    return (await spotifyApi.getArtistTopTracks(artistId, market)).body;
  });
}


module.exports = {
  fetchArtistTracks,
  fetchTrackInfo,
  fetchTracksInfo,
};
