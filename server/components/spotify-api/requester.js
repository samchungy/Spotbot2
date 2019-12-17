const logger = require('pino')()

async function apiCall(name, api){
    let attempts = 3;
    while (attempts){
        try {
            logger.info(`Calling Spotify API: ${name}`);
            return await api();
        } catch (error) {
            logger.error(error);
            if (error.name.contains(`WebapiError`) && error.statusCode){
                //Retry 500 errors
                if (error.statusCode >= 500 && error.statusCode < 600){
                    attempts--;
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