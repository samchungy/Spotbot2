const logger = require('pino')()
const spotifyWebApi = require('./initialise');

function tryRequest(apiCall, apiName){
    let requestAttempts = 3;
    while (requestAttempts > 0){
        try {
            await apiCall()
        } catch (error) {
            requestAttempts--;
            logger.error(`SPOTIFY WEB API: ${error.statusCode}: ${error.name} - ${error.message}`);
            //Insert deal with error logic
        }
    }
    throw new Error("Maximum API call retry limit hit");
}

