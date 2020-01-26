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

module.exports = {
  fetchTrackInfo,
};
