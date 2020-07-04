
const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Fetches available Devices from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 */
const fetchDevices = async (teamId, channelId, auth) => {
  return await requester(teamId, channelId, auth, 'Get Spotify Devices', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    return spotifyApi.getMyDevices()
        .then((data) => data.body);
  });
};

module.exports = {
  fetchDevices,
};
