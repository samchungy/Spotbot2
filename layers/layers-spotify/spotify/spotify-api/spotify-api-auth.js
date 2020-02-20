const config = require(process.env.CONFIG);
const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');
const SCOPES = config.spotify_api.scopes;

/**
 * Fetches an authorize URL from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} triggerId
 */
async function fetchAuthorizeURL(teamId, channelId, auth, triggerId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return await requester(teamId, channelId, auth, 'Create Authorize URL', async () => await spotifyApi.createAuthorizeURL(SCOPES, triggerId, true));
}

/**
 * Fetches tokens from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} code
 */
async function fetchTokens(teamId, channelId, auth, code) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Authorization Code Grant', async () => await spotifyApi.authorizationCodeGrant(code))).body;
}

module.exports = {
  fetchAuthorizeURL,
  fetchTokens,
};
