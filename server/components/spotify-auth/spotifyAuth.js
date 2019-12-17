const logger = require('pino')();
const config = require('config');
const callback_path = config.get('spotify_api.callback');
const { createAuthorizeURL, requestTokens } = require('../spotify-api/auth');
const { getState, storeState } = require('./spotifyAuthDAL');

async function getAuthorizationURL(trigger_id, host){
    try {
        //TODO Store trigger_id as Spotify Auth state.
        await storeState(trigger_id);
        let auth_url = await createAuthorizeURL(trigger_id, `http://${host}/${callback_path}`);
        return auth_url;
    } catch (error) {
        logger.error(error)
        //TODO Handle status report to Slack
    }
}

async function getTokens(code, state){
    try {
        if (!verifyState(state)){
            return {success: false, failReason: "Invalid State"}
        }
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
    //Check state is valid, else redirect.
    try {
        let current_state = await getState(trigger_id).Item.value;
        return current_state === state;
    } catch (error) {
        throw error;
    }
    //TODO: 
}

module.exports = {
    getAuthorizationURL,
    getTokens
}