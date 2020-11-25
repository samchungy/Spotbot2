const CONFIG = require('/opt/config/config');
const {loadAuth} = require('/opt/db/spotify-auth-interface');
const {renewToken} = require('./spotify-auth-refresh');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');

const ACCESS = CONFIG.dynamodb.auth_spotify.access;
const REFRESH = CONFIG.dynamodb.auth_spotify.refresh;
const EXPIRES = CONFIG.dynamodb.auth_spotify.expires;
const PROFILE = CONFIG.dynamodb.auth_spotify.profile;

/**
 * @param {string} teamId
 * @param {string} channelId
 */
const authSession = async (teamId, channelId) => {
  const auth = await loadAuth(teamId, channelId);
  const team = teamId;
  const channel = channelId;

  const refreshAuth = async () => {
    if (auth) {
      const {accessToken, expiry} = await renewToken(team, channel, auth[ACCESS], auth[REFRESH]);
      auth[ACCESS] = accessToken;
      auth[EXPIRES] = expiry;
    }
  };

  /**
   * Returns our Access Token
   * @return {Promise<string>} AccessToken or null
   */
  const getAccess = async () => {
    if (auth && auth[ACCESS]) {
      if (moment().unix() >= auth[EXPIRES]) {
        await refreshAuth();
      }
      return auth[ACCESS];
    }
    return null;
  };

  /**
   * @return {object}
   */
  const getProfile = () => auth ? auth[PROFILE]: null;

  const isExpired = () => moment().unix() >= auth[EXPIRES];

  return {
    getAccess,
    getProfile,
    isExpired,
    refreshAuth,
  };
};

module.exports = {authSession};
