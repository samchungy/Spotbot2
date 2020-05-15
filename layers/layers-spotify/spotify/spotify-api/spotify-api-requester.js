const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {refreshAccessToken} = require('./spotify-api-refresh');
const {AuthError} = require('/opt/errors/errors-auth');
const {sleep} = require('/opt/utils/util-timeout');
const MAX_ATTEMPTS = config.spotify_api.maximum_request_attempts;

const requester = async (teamId, channelId, auth, name, api) => {
  const callApi = (attempt=0, reAuthed=false) => {
    return api() // Call API
        .catch(async (error) => {
          logger.error(`Spotify API ${name} failed - ${JSON.stringify(error)}`);
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
          throw error;
        });
  };
  return callApi();
};

module.exports = requester;
