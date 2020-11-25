const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');

const {refreshAccessToken} = require('../spotify-api-v2/spotify-api-auth');
const {loadAuth, changeTokens, removeAuth} = require('/opt/db/spotify-auth-interface');
const {changeSettings} = require('/opt/db/settings-interface');
const {AuthError} = require('/opt/errors/errors-spotify');

const ACCESS = config.dynamodb.auth_spotify.access;
const EXPIRES = config.dynamodb.auth_spotify.expires;
const PLAYLIST = config.dynamodb.settings.playlist;
const DEFAULT_DEVICE = config.dynamodb.settings.default_device;

const ERRORS = {
  renew: 'Failed to renew a token',
  invalidate: `Failed to invalidate the auth and settings`,
};

const alreadyRenewed = (accessToken, auth) => auth && accessToken != auth[ACCESS];

const renewToken = async (teamId, channelId, accessToken, refreshToken) => {
  const auth = await loadAuth(teamId, channelId);
  // Check if we've already renewed a token in another call
  if (alreadyRenewed(accessToken, auth)) {
    return {accessToken: auth[ACCESS], expiry: auth[EXPIRES]};
  }
  const {access_token: newAccessToken} = await refreshAccessToken(refreshToken)
      .catch(async (err) => {
        await invalidateAuth(teamId, channelId);
        logger.error(err, ERRORS.renew);
        throw new AuthError(ERRORS.renew);
      });
  const expiry = moment().add(55, 'm').unix();
  await changeTokens(teamId, channelId, newAccessToken, expiry);
  return {expiry, accessToken: newAccessToken};
};

/**
 * Removes authentication from DB, disables Spotbot setup
 * @param {string} teamId
 * @param {string} channelId
 */
const invalidateAuth = async (teamId, channelId) => {
  return Promise.all([
    changeSettings(teamId, channelId, {[DEFAULT_DEVICE]: null, [PLAYLIST]: null}),
    removeAuth(teamId, channelId),
  ]).catch((error) => {
    logger.error(error, ERRORS.invalidate);
    throw error;
  });
};

module.exports = {
  renewToken,
  invalidateAuth,
};
