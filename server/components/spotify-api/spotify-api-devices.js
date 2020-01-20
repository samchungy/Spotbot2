
const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Fetches available Devices from Spotify
 * @param {string} teamId
 * @param {string} channelId
 */
async function fetchDevices(teamId, channelId ) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return (await requester(teamId, channelId, 'Get Spotify Devices', async () => await spotifyApi.getMyDevices())).body;
}

module.exports = {
  fetchDevices,
};
