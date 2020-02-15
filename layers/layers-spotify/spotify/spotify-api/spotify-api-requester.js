const logger = require(process.env.LOGGER);

const {refreshAccessToken} = require('./spotify-api-refresh');
const {AuthError} = require('/opt/errors/errors-auth');
const {sleep} = require('/opt/utils/util-timeout');

/**
 * Our API Caller for Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} name
 * @param {function} api Spotify API function to run
 */
async function apiCall(teamId, channelId, name, api) {
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
          // Wait a second before the next execution.
          await sleep(1000);
        } else if (error.statusCode == 401) {
          // Try Reauthenticte
          attempts--;
          if (attempts == 0) {
            throw error;
          }
          try {
            await refreshAccessToken(teamId, channelId);
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
