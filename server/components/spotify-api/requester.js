const { refreshAccessToken } = require('./refresh');
const logger = require('../../util/logger');
const {sleep} = require('../../util/timeout');

async function apiCall(name, api){
    let attempts = 3;
    while (attempts){
        try {
            logger.info(`Calling Spotify API: ${name}`);
            return await api();
        } catch (error) {
            logger.error(error);
            if (error.name.includes(`WebapiError`) && error.statusCode){
                //Retry 500 errors
                if (error.statusCode >= 500 && error.statusCode < 600){
                    attempts--;
                    // Wait a few seconds before the next execution.
                    await sleep(3000);
                } else if (error.statusCode == 401){
                    //Try Reauthenticte
                    attempts--;
                    logger.info("Getting new access token");
                    try {
                        await refreshAccessToken();
                    } catch (error) {
                        throw error;
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