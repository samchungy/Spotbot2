const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');
const spotifyWebApi = require('./spotify-api-initialise');
const {refreshAccessToken} = require('./spotify-api-refresh');

/**
 * Sets tokens in the Spotify Api object.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} auth
 * @param {string} url
 */
const setTokens = async (teamId, channelId, auth, url) => {
  const now = moment().unix();
  if (auth.getAccess() && auth.getExpires() < now) {
    // Our Token has expired, try to refresh
    await refreshAccessToken(teamId, channelId, auth);
  }
  spotifyWebApi.setAccessToken(auth.getAccess());
  spotifyWebApi.setRefreshToken(auth.getRefresh());
  if (url) {
    spotifyWebApi.setRedirectURI(url);
  }
  return spotifyWebApi;
};

module.exports = setTokens;
