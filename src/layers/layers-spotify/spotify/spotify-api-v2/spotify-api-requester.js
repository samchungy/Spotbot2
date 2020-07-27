const {AuthError} = require('/opt/errors/errors-spotify');
const config = require('./config');
const logger = require('/opt/utils/util-logger');
const httpClient = require('./spotify-api-client');
// Util
const {sleep} = require('/opt/utils/util-timeout');

const ERRORS = {
  client: 'Client Error',
  no_response: 'Response/Timeout Error',
  uncategorized: 'Uncategorized Error',
  uncategorized_auth: 'Uncategorized Authentication Error',
  reauthentication: 'Reauthentication Error',
  max_retry: (num) => `Max Retrys ${num} Reached Error`,
};

/**
 * @callback axiosCall
 * @param {import('axios').default} client Axios Client
 */

/**
 *
 * @param {Auth} auth
 * @param {axiosCall} apiCall
 */
const requester = async (auth, apiCall) => {
  const request = async (attempt=0, prevAuthError=false, waitTime=0) => {
    if (attempt < config.maxRequests) {
      await sleep(waitTime*1000);
      const accessToken = await auth.getAccess();
      const client = httpClient(accessToken);

      return apiCall(client).catch(async (err) => {
        // Handle Axios Error
        if (err.isAxiosError) {
          logger.error(`Spotify API Error: ${err.config.url}`);
        }
        if (err.response) {
          const status = err.response.status;
          const error = err.response.data.error;
          if (status === 401) {
            if (prevAuthError) {
              logger.error({error}, ERRORS.reauthentication);
              throw new AuthError(ERRORS.reauthentication);
            }
            // Expired Error
            if (error.message === config.errors.expired) {
              await auth.refreshAuth();
              return request(attempt+1, true);
            }
            logger.error({error}, ERRORS.uncategorized_auth);
            throw new AuthError(ERRORS.uncategorized_auth);
          } else if (status === 429) {
            // Rate Limit
            const retryAfterTime = err.response.headers['Retry-After'];
            return request(attempt+1, false, retryAfterTime);
          } else if (status >= 500 ) {
            return request(attempt+1, false, 0.5);
          } else {
            logger.error(err.toJSON());
            logger.error(error, ERRORS.uncategorized);
            throw new Error(ERRORS.uncategorized);
          }
        } else if (err.request) {
          logger.error({err}, ERRORS.no_response);
          throw new Error(ERRORS.no_response);
        } else {
          logger.error({err}, ERRORS.client);
          throw new Error(ERRORS.client);
        }
      });
    }
    logger.error(ERRORS.max_retry(config.maxRequests));
    throw new Error(ERRORS.max_retry(config.maxRequests));
  };
  return request();
};

module.exports = requester;
