const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Fetches the current user's profile from Spotify
 * @param {string} teamId
 * @param {string} channelId
 */
async function fetchProfile(teamId, channelId ) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return (await requester(teamId, channelId, 'Get Spotify Profile', async () => await spotifyApi.getMe())).body;
}

/**
 * Fetches a specific user profile
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} user
 */
async function fetchUserProfile(teamId, channelId, user) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return (await requester(teamId, channelId, 'Get Spotify User Profile', async () => await spotifyApi.getUser(user))).body;
}

module.exports = {
  fetchProfile,
  fetchUserProfile,
};
