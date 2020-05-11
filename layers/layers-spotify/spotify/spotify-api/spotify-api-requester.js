const logger = require(process.env.LOGGER);
const {refreshAccessToken} = require('./spotify-api-refresh');
const {AuthError} = require('/opt/errors/errors-auth');
const {sleep} = require('/opt/utils/util-timeout');
const MAX_ATTEMPTS = 3;

const requester = async (teamId, channelId, auth, name, api) => {
  const callApi = (attempt=0, reAuthed=false) => {
    return api() // Call API
        .catch(async (error) => {
          logger.error(`Spotify API ${name} failed - ${JSON.stringify(error)}`);
          if (attempt > MAX_ATTEMPTS) {
            Promise.reject(new Error(`Maximum retries ${MAX_ATTEMPTS} exceeeded.`));
          }
          // If it is a Spotify Error, gracefully handle it
          if (error.name.includes(`WebapiError`) && error.statusCode) {
            // Retry 500 errors
            if (error.statusCode >= 500 && error.statusCode < 600) {
              // Wait before the next execution.
              await sleep(1000*attempt+1);
              return api(attempt+1);
            } else if (error.statusCode == 401) {
              // Check if auth has failed twice
              if (reAuthed) {
                Promise.reject(new AuthError());
              }
              // Try to re-authenticte
              await refreshAccessToken(teamId, channelId, auth)
                  .catch((err) => {
                    logger.error(`Spotify re-authentication failed - ${JSON.stringify(err)}`);
                    Promise.reject(new AuthError());
                  });
              return api(attempt+1, true);
            }
          }
          throw error;
        });
  };
  return callApi();
};

module.exports = requester;
