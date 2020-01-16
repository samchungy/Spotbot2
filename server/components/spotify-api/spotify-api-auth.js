const config = require('config');
const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');
const SCOPES = config.get('spotify_api.scopes');

/**
 * Fetches the current user's profile from Spotify
 */
async function fetchProfile() {
  const spotifyApi = await spotifyWebApi();
  return (await requester('Get Spotify Profile', async () => await spotifyApi.getMe())).body;
}

/**
 * Fetches an authorize URL from Spotify
 * @param {string} triggerId
 */
async function fetchAuthorizeURL(triggerId) {
  const spotifyApi = await spotifyWebApi();
  return await requester('Create Authorize URL', async () => await spotifyApi.createAuthorizeURL(SCOPES, triggerId, true));
}

/**
 * Fetches tokens from Spotify
 * @param {string} code
 */
async function fetchTokens(code) {
  const spotifyApi = await spotifyWebApi();
  return (await requester('Authorization Code Grant', async () => await spotifyApi.authorizationCodeGrant(code))).body;
}

module.exports = {
  fetchAuthorizeURL,
  fetchProfile,
  fetchTokens,
};
