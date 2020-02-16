const spotifyWebApi = require('./spotify-api-initialise');
const {refreshAccessToken} = require('./spotify-api-refresh');
const {loadTokens} = require('../spotify-auth/spotify-auth-dal');
const moment = require(process.env.MOMENT);

/**
 * Sets tokens in the Spotify Api object.
 * @param {string} teamId
 * @param {string} channelId
 */
async function setTokens(teamId, channelId) {
  let {accessToken, refreshToken, expires} = await loadTokens(teamId, channelId);
  if (expires && moment(expires).isBefore(moment())) {
    // Our Token has expired, try to refresh
    accessToken = await refreshAccessToken(teamId, channelId, accessToken, refreshToken);
  }
  spotifyWebApi.setAccessToken(accessToken);
  spotifyWebApi.setRefreshToken(refreshToken);
  return spotifyWebApi;
};

module.exports = setTokens;
