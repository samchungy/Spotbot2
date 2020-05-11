const CONFIG = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);
const spotifyWebApi = require('./spotify-api-initialise');
const {loadAuth, changeTokens, removeAuth} = require('../spotify-auth/spotify-auth-interface');
const {changeSettings} = require('/opt/settings/settings-interface');

const ACCESS = CONFIG.dynamodb.auth_spotify.access;
const REFRESH = CONFIG.dynamodb.auth_spotify.refresh;
const EXPIRES = CONFIG.dynamodb.auth_spotify.expires;

const DEFAULT_DEVICE = CONFIG.dynamodb.settings.default_device;
const PLAYLIST = CONFIG.dynamodb.settings.playlist;

/**
 * Refreshes the current Access Token
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 */
async function refreshAccessToken(teamId, channelId, auth) {
  try {
    const now = moment();
    const newAuth = await loadAuth(teamId, channelId);

    // Check if we've already renewed a token in another call
    if (auth.getAccess() != newAuth[ACCESS] && moment.unix(newAuth[EXPIRES]).isAfter(now)) {
      return auth.update(newAuth[ACCESS], newAuth[EXPIRES]);
    }

    spotifyWebApi.setRefreshToken(newAuth[REFRESH]);
    spotifyWebApi.setAccessToken(newAuth[ACCESS]);

    const {access_token: newAccessToken} = (await spotifyWebApi.refreshAccessToken()).body;
    const newExpiry = moment().add(55, 'm').unix();
    await changeTokens(teamId, channelId, newAccessToken, newExpiry);
    return auth.update(newAccessToken, newExpiry);
  } catch (err) {
    logger.error(`Failed to refresh access token - ${JSON.stringify(err)}`);
    // Invalidate our current Tokens and Spotify based Settings
    await Promise.all([
      changeSettings(teamId, channelId, {[DEFAULT_DEVICE]: null, [PLAYLIST]: null}),
      removeAuth(teamId, channelId),
    ]).catch((error) => {
      logger.error(`Failed to invalidate the settings - ${JSON.stringify(error)}`);
      throw error;
    });
    throw err;
  }
};

module.exports = {
  refreshAccessToken,
};
