
const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Fetches available Devices from Spotify
 */
async function fetchDevices() {
  const spotifyApi = await spotifyWebApi();
  return (await requester('Get Spotify Devices', async () => await spotifyApi.getMyDevices())).body;
}

module.exports = {
  fetchDevices,
};
