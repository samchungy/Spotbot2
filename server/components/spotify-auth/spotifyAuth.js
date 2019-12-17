const logger = require('pino')();
const { createAuthorizeURL, requestTokens } = require('../spotify-api/auth');
const config = require('config');
const callback_path = config.get('spotify_api.callback');

async function getAuthorizationURL(trigger_id, host){
    try {
        //TODO Store trigger_id as Spotify Auth state.
        let auth_url = await createAuthorizeURL(trigger_id, `http://${host}/${callback_path}`);
        return auth_url;
    } catch (error) {
        logger.error(error)
        //TODO Handle status report to Slack
    }
}

async function getTokens(code, state){
    try {
        verifyState(state);
        let { access_token, refresh_token } = await requestTokens(code);
        // TODO Insert tokens into DB
        return {success: true, failReason: null}
    } catch (error) {
        logger.error(error)
        return {success: false, failReason: "Yeet"}
        //TODO Handle status report to Slack
    }
}

async function verifyState(state){
    //TODO: Check state is valid, else redirect.
}

module.exports = {
    getAuthorizationURL,
    getTokens
}