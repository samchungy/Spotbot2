const {spotifyWebApi} = require('./spotify-api-initialise');
const {storeTokens} = require('../spotify-auth/spotifyauth-dal');
const {storeDefaultDevice, storePlaylist} = require('/opt/settings/settings-interface');

/**
 * Refreshes the current Access Token
 * @param {string} teamId
 * @param {string} channelId
 */
async function refreshAccessToken(teamId, channelId ) {
  try {
    const spotifyApi = await spotifyWebApi(teamId, channelId );
    const token = (await spotifyApi.refreshAccessToken()).body;
    spotifyApi.setAccessToken(token.access_token);
    await storeTokens(teamId, channelId, token.access_token, spotifyApi.getRefreshToken());
  } catch (error) {
    logger.error(error);
    // Invalidate our current Tokens and Spotify based Settings
    await Promise.all([storePlaylist(teamId, channelId, null, null), storeDefaultDevice(teamId, channelId, null), storePlaylistSetting(teamId, channelId, null)]);
    throw error;
  }
}

module.exports = {
  refreshAccessToken,
};
