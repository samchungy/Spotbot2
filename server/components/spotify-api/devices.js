
const {spotifyWebApi} = require('./initialise');
const requester = require('./requester');

/**
 * Fetches available Devices from Spotify
 */
async function fetchDevices() {
  const spotifyApi = await spotifyWebApi();
  return await requester('Get Spotify Devices', () => spotifyApi.getMyDevices());
}

module.exports = {
  fetchDevices,
};
