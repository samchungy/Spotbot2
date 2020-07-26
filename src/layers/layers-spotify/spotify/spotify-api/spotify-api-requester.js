const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const {refreshAccessToken} = require('./spotify-api-refresh');

// Errors
const {AuthError} = require('/opt/errors/errors-spotify');

// Utility Function
const {sleep} = require('/opt/utils/util-timeout');
const MAX_ATTEMPTS = config.spotify_api.maximum_request_attempts;

const requester = async (teamId, channelId, auth, name, api) => {
  const callApi = (attempt=0, reAuthed=false) => {
    return api() // Call API
        .catch(async (error) => {
          logger.error(error, `Spotify API ${name} failed`);
          if (attempt > MAX_ATTEMPTS) {
            throw new Error(`Maximum retries ${MAX_ATTEMPTS} exceeeded.`);
          }
          // If it is a Spotify Error, gracefully handle it
          if (error.name.includes(`WebapiError`) && error.statusCode) {
            // Retry 500 errors with backoff
            if (error.statusCode >= 500 && error.statusCode < 600) {
              await sleep(1000*attempt+1);
              return api(attempt+1);
            } else if (error.statusCode == 401) {
              // Check if auth has failed already
              if (reAuthed) {
                throw new AuthError();
              }
              // Try to re-authenticte
              await refreshAccessToken(teamId, channelId, auth);
              return api(attempt+1, true);
            }
          }
          throw new Error('Spotify Api failed');
        });
  };
  return callApi();
};

module.exports = requester;
