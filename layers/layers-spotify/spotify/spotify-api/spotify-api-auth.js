const config = require(process.env.CONFIG);
const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');
const SCOPES = config.spotify_api.scopes;

/**
 * Fetches an authorize URL from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} state
 * @param {string} url
 */
async function fetchAuthorizeURL(teamId, channelId, auth, state, url) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth, url);
  return await requester(teamId, channelId, auth, 'Create Authorize URL', async () => await spotifyApi.createAuthorizeURL(SCOPES, state, true));
}

/**
 * Fetches tokens from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} code
 * @param {string} url
 */
async function fetchTokens(teamId, channelId, auth, code, url) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth, url);
  return (await requester(teamId, channelId, auth, 'Authorization Code Grant', async () => await spotifyApi.authorizationCodeGrant(code))).body;
}

module.exports = {
  fetchAuthorizeURL,
  fetchTokens,
};
