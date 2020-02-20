
const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Fetches available Devices from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 */
async function fetchDevices(teamId, channelId, auth) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Get Spotify Devices', async () => await spotifyApi.getMyDevices())).body;
}

module.exports = {
  fetchDevices,
};
