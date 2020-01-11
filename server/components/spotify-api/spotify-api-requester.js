const {refreshAccessToken} = require('./spotify-api-refresh');
const {AuthError} = require('../../errors/errors-auth');
const logger = require('../../util/util-logger');
const {sleep} = require('../../util/util-timeout');

/**
 * Our API Caller for Spotify
 * @param {string} name
 * @param {function} api Spotify API function to run
 */
async function apiCall(name, api) {
  let attempts = 3;
  while (attempts) {
    try {
      logger.info(`Calling Spotify API: ${name}`);
      return await api();
    } catch (error) {
      logger.error(error);
      if (error.name.includes(`WebapiError`) && error.statusCode) {
        // Retry 500 errors
        if (error.statusCode >= 500 && error.statusCode < 600) {
          attempts--;
          // Wait a few seconds before the next execution.
          await sleep(3000);
        } else if (error.statusCode == 401) {
          // Try Reauthenticte
          attempts--;
          logger.info('Getting new access token');
          try {
            await refreshAccessToken();
          } catch (error) {
            throw new AuthError();
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
}

module.exports = apiCall;
