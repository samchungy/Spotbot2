const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);
const spotifyWebApi = require('./spotify-api-initialise');
const {loadSpotifyAuth, changeSpotifyAuth, removeSpotifyAuth} = require('../spotify-auth/spotify-auth-interface');
const {changeSettings} = require('/opt/settings/settings-interface');

const ACCESS = config.dynamodb.auth.access;
const REFRESH = config.dynamodb.auth.refresh;
const EXPIRES = config.dynamodb.auth.expires;

const DEFAULT_DEVICE = config.dynamodb.settings.default_device;
const PLAYLIST = config.dynamodb.settings.playlist;

/**
 * Refreshes the current Access Token
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 */
async function refreshAccessToken(teamId, channelId, auth) {
  try {
    const now = moment();
    const newAuth = await loadSpotifyAuth(teamId, channelId);

    // Check if we've already renewed a token in another call
    if (auth.getAccess() != newAuth[ACCESS] && moment(newAuth[EXPIRES]).isAfter(now)) {
      return auth.update(newAuth[ACCESS], newAuth[EXPIRES]);
    }
    spotifyWebApi.setRefreshToken(newAuth[REFRESH]);
    spotifyWebApi.setAccessToken(newAuth[ACCESS]);

    const {access_token: newAccessToken} = (await spotifyWebApi.refreshAccessToken()).body;
    const newExpiry = moment().add(55, 'm').toISOString();
    await changeSpotifyAuth(teamId, channelId, [
      {key: ACCESS, value: newAccessToken},
      {key: EXPIRES, value: newExpiry},
    ]);
    return auth.update(newAccessToken, newExpiry);
  } catch (error) {
    logger.error(error);
    // Invalidate our current Tokens and Spotify based Settings
    try {
      await Promise.all([
        changeSettings(teamId, channelId, [
          {key: DEFAULT_DEVICE, value: null},
          {key: PLAYLIST, value: null},
        ]),
        removeSpotifyAuth(teamId, channelId),
      ]);
    } catch (error) {
      logger.error('Failed to invalidate the settings');
    }
    throw error;
  }
};

module.exports = {
  refreshAccessToken,
};
