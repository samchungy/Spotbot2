const moment = require(process.env.MOMENT);
const spotifyWebApi = require('./spotify-api-initialise');
const {loadTokens, storeTokens} = require('../spotify-auth/spotify-auth-dal');
const {storeDefaultDevice, storePlaylist} = require('/opt/settings/settings-interface');

/**
 * Refreshes the current Access Token
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} accessToken
 * @param {string} refreshToken
 */
async function refreshAccessToken(teamId, channelId, accessToken, refreshToken) {
  try {
    if (!refreshToken) {
      const {refreshToken: refresh, accessToken: access} = loadTokens(teamId, channelId);
      refreshToken = refresh;
      accessToken = access;
    }
    spotifyWebApi.setRefreshToken(refreshToken);
    spotifyWebApi.setAccessToken(accessToken);

    const {access_token: newAccessToken} = (await spotifyWebApi.refreshAccessToken()).body;
    spotifyWebApi.setAccessToken(newAccessToken);
    await storeTokens(teamId, channelId, newAccessToken, refreshToken, moment().add(55, 'm').toISOString());
    return newAccessToken;
  } catch (error) {
    logger.error(error);
    // Invalidate our current Tokens and Spotify based Settings
    await Promise.all([storePlaylist(teamId, channelId, null, null), storeDefaultDevice(teamId, channelId, null)]);
    throw error;
  }
}

module.exports = {
  refreshAccessToken,
};
