const config = require(process.env.CONFIG);
const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');
const SCOPES = config.spotify_api.scopes;

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
  fetchTokens,
};
