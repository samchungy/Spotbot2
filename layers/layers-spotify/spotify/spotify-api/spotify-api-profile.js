const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Fetches the current user's profile from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 */
const fetchProfile = async (teamId, channelId, auth) => {
  return await requester(teamId, channelId, auth, 'Get Spotify Profile', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    return spotifyApi.getMe()
        .then((data) => data.body);
  });
};

/**
 * Fetches a specific user profile
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} user
 */
const fetchUserProfile = async (teamId, channelId, auth, user) => {
  return await requester(teamId, channelId, auth, 'Get Spotify User Profile', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    return spotifyApi.getUser(user)
        .then((data)=>data.body);
  });
};

module.exports = {
  fetchProfile,
  fetchUserProfile,
};
