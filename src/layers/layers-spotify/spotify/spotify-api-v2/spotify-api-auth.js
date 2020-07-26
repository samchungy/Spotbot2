const config = require('./config');
const client = require('./spotify-api-auth-client');
const qs = require('qs');
const logger = require('/opt/utils/util-logger');
const ERRORS = {
  fetch: 'Fetching tokens failed',
};

/**
 * @param {string[]} scopes
 * @param {string} redirectUri
 * @param {string} state
 * @return {string} Authorization Url
 */
const fetchAuthUrl = (scopes, redirectUri, state) => {
  const authScopes = scopes.join(' ');
  return config.baseAuthUrl + config.authEndpoints.authorize +
  '?response_type=code' +
  `&client_id=${config.clientId}` +
  `&scope=${encodeURIComponent(authScopes)}` +
  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
  `&state=${state}` +
  `&show_dialog=true`;
};

/**
 * @param {string} code
 * @param {string} url
 */
const fetchTokens = async (code, url) => {
  return client.post(config.authEndpoints.token, qs.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: url,
  })).then((response) => response.data).catch((err) => {
    if (err.response) {
      const error = err.response.data.error;
      logger.error({error}, ERRORS.fetch);
      throw new Error(ERRORS.fetch);
    }
  });
};

/**
 * @param {string} refreshToken
 */
const refreshAccessToken = async (refreshToken) => {
  return client.post(config.authEndpoints.token, qs.stringify({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })).then((response) => response.data);
};

module.exports = {
  fetchAuthUrl,
  fetchTokens,
  refreshAccessToken,
};
