const logger = require('pino')();
const config = require('config');
const { createAuthorizeURL, requestTokens, getSpotifyProfile } = require('../spotify-api/auth');
const { getState, storeState, storeTokens, storeProfile } = require('./spotifyAuthDAL');
// const MyEmitter = require('../../util/eventEmitter');

async function getAuthorizationURL(trigger_id){
    try {
        //TODO Store trigger_id as Spotify Auth state.
        await storeState(trigger_id);
        let auth_url = await createAuthorizeURL(trigger_id);
        return auth_url;
    } catch (error) {
        logger.error(error)
        //TODO Handle status report to Slack
    }
}

async function validateAuthCode(code, state){
    try {
        if (!await verifyState(state)){
            return {success: false, failReason: "Invalid State"}
        }
        //Get Tokens from Spotify
        let { access_token, refresh_token } = await requestTokens(code);
        //Store our tokens in our DB
        await storeTokens(access_token, refresh_token);

        //Get Spotify URI for Authenticator
        let profile = await getSpotifyProfile();
        await storeProfile(profile.id);
        return {success: true, failReason: null}
    } catch (error) {
        logger.error(error)
        return {success: false, failReason: `${error.message}`}
        //TODO Handle status report to Slack
    }
}

async function verifyState(state){
    //Check state is valid, else redirect.
    try {
        let current_state = await getState();
        return current_state === state;
    } catch (error) {
        throw error;
    }
    //TODO: 
}

module.exports = {
    getAuthorizationURL,
    validateAuthCode
}