const config = require('config');
const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');
const SCOPES = config.get('spotify_api.scopes');

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
 * Fetches an authorize URL from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} triggerId
 */
async function fetchAuthorizeURL(teamId, channelId, triggerId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return await requester(teamId, channelId, 'Create Authorize URL', async () => await spotifyApi.createAuthorizeURL(SCOPES, triggerId, true));
}

/**
 * Fetches tokens from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} code
 */
async function fetchTokens(teamId, channelId, code) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return (await requester(teamId, channelId, 'Authorization Code Grant', async () => await spotifyApi.authorizationCodeGrant(code))).body;
}

module.exports = {
  fetchAuthorizeURL,
  fetchProfile,
  fetchTokens,
};
