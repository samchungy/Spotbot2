const {spotifyWebApi} = require('./spotify-api-initialise');
const {storeTokens} = require('../settings/spotifyauth/spotifyauth-dal');
const {storeDeviceSetting, storePlaylistSetting} = require('../settings/settings-dal');

/**
 * Refreshes the current Access Token
 */
async function refreshAccessToken() {
  try {
    const spotifyApi = await spotifyWebApi();
    const token = (await spotifyApi.refreshAccessToken()).body;
    spotifyApi.setAccessToken(token.access_token);
    await storeTokens(token.access_token, spotifyApi.getRefreshToken());
  } catch (error) {
    logger.error(error);
    // Invalidate our current Tokens
    await storeTokens(null, null);
    storeDeviceSetting(null);
    storePlaylistSetting(null);
    // TODO Slack Post -> Run /spotbot settings to reauthenticate
    throw error;
  }
}

module.exports = {
  refreshAccessToken,
};
