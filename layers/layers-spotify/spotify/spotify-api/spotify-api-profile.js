const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Fetches the current user's profile from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 */
async function fetchProfile(teamId, channelId, auth) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Get Spotify Profile', async () => await spotifyApi.getMe())).body;
}

/**
 * Fetches a specific user profile
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} user
 */
async function fetchUserProfile(teamId, channelId, auth, user) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Get Spotify User Profile', async () => await spotifyApi.getUser(user))).body;
}

module.exports = {
  fetchProfile,
  fetchUserProfile,
};
