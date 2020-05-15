const CONFIG = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);

// Errors
const {AuthError} = require('/opt/errors/errors-auth');
// Spotify
const spotifyWebApi = require('./spotify-api-initialise');
const {loadAuth, changeTokens, removeAuth} = require('/opt/db/spotify-auth-interface');
// Settings
const {changeSettings} = require('/opt/db/settings-interface');
// Config
const ACCESS = CONFIG.dynamodb.auth_spotify.access;
const REFRESH = CONFIG.dynamodb.auth_spotify.refresh;
const EXPIRES = CONFIG.dynamodb.auth_spotify.expires;
const PLAYLIST = CONFIG.dynamodb.settings.playlist;
const DEFAULT_DEVICE = CONFIG.dynamodb.settings.default_device;

// Utility Functions
const alreadyRenewed = (auth, newAuth) => newAuth && auth.getAccess() != newAuth[ACCESS] && newAuth[EXPIRES] > auth.getExpires();

// Refresh the token
const refreshAccess = async (teamId, channelId, auth, accessToken, refreshToken) => {
  spotifyWebApi.setAccessToken(accessToken);
  spotifyWebApi.setRefreshToken(refreshToken);
  const newAccessToken = await spotifyWebApi.refreshAccessToken()
      .then((data) => data.body.access_token);
  const newExpiry = moment().add(55, 'm').unix();
  await changeTokens(teamId, channelId, newAccessToken, newExpiry);
  return auth.update(newAccessToken, newExpiry);
};

/**
 * Removes authentication from DB, disables Spotbot setup
 * @param {string} teamId
 * @param {string} channelId
 */
const invalidateAuth = async (teamId, channelId) => {
  return await Promise.all([
    changeSettings(teamId, channelId, {[DEFAULT_DEVICE]: null, [PLAYLIST]: null}),
    removeAuth(teamId, channelId),
  ]).catch((error) => {
    logger.error(`Failed to invalidate the auth and settings`);
    logger.error(error);
    throw error;
  });
};

/**
 * Refreshes auth access token
 * @param {string} teamId
 * @param {string} channelId
 * @param {object} auth
 */
const refreshAccessToken = async (teamId, channelId, auth) => {
  // Check if we already renewed the authentication
  const newAuth = await loadAuth(teamId, channelId);
  // Check if we've already renewed a token in another call
  if (alreadyRenewed(auth, newAuth)) {
    return auth.update(newAuth[ACCESS], newAuth[EXPIRES]);
  }
  return refreshAccess(teamId, channelId, auth, newAuth[ACCESS], newAuth[REFRESH])
      .catch(async (err) => {
        logger.error('Failed to refresh access token');
        logger.error(err);
        await invalidateAuth(teamId, channelId);
        throw new AuthError();
      });
};

module.exports = {
  invalidateAuth,
  refreshAccessToken,
};
