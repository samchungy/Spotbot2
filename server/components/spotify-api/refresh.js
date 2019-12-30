const {spotifyWebApi} = require('./initialise');
const {storeTokens} = require('../settings/spotifyAuth/spotifyAuthDAL');

/**
 * Refreshes the current Access Token
 */
async function refreshAccessToken() {
  try {
    const spotifyApi = await spotifyWebApi();
    const token = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(token.body.access_token);
    await storeTokens(token.body.access_token, spotifyApi.getRefreshToken());
  } catch (error) {
    // Invalidate our current Tokens
    await storeTokens(null, null);
    // TODO Slack Post -> Run /spotbot settings to reauthenticate
    throw error;
  }
}

module.exports = {
  refreshAccessToken,
};
