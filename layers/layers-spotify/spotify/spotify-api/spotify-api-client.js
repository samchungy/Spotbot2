const moment = require(process.env.MOMENT);
const spotifyWebApi = require('./spotify-api-initialise');
const {refreshAccessToken} = require('./spotify-api-refresh');

/**
 * Sets tokens in the Spotify Api object.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} auth
 * @param {string} url
 */
async function setTokens(teamId, channelId, auth, url) {
  const now = moment();
  // New Authentication
  if (auth.getAccess()) {
    if (moment(auth.getExpires()).isBefore(now)) {
      // Our Token has expired, try to refresh
      await refreshAccessToken(teamId, channelId, auth);
    }
  }
  spotifyWebApi.setAccessToken(auth.getAccess());
  spotifyWebApi.setRefreshToken(auth.getRefresh());
  if (url) {
    spotifyWebApi.setRedirectURI(url);
  }
  return spotifyWebApi;
};

module.exports = setTokens;
