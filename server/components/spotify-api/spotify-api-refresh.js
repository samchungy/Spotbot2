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
    // Invalidate our current Tokens and Spotify based Settings
    await Promise.all([storeTokens(null, null), storeDeviceSetting(null), storePlaylistSetting(null)]);
    throw error;
  }
}

module.exports = {
  refreshAccessToken,
};
