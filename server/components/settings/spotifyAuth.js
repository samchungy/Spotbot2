const logger = require('../../util/logger');
const config = require('config');
const { AuthError } = require('../../errors/auth');
const { createAuthorizeURL, requestTokens, getSpotifyProfile } = require('../spotify-api/auth');
const { getState, storeState, storeTokens, storeProfile } = require('./spotifyAuthDAL');
const { buttonSection, context } = require('../slack/format/modal');
const SETTINGS_HELPER = config.get('dynamodb.settings_helper');
const HINTS = config.get('settings.hints');
const PREMIUM_ERROR = config.get('spotify_api.auth.errors.premium_error');
const AUTH_FAIL = config.get('spotify_api.auth.errors.auth_fail_error');

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
            await storeTokens(null, null);
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

async function authBlock(trigger_id, failed){
    try {
        let blocks = [];
        let auth_error;
        let url = await getAuthorizationURL(trigger_id);

        try {
            let profile = await getSpotifyProfile();
            if (profile.product != "premium"){
                throw new AuthError(PREMIUM_ERROR)
            } else {
                //Place authenticated 
                blocks.push(
                    buttonSection(SETTINGS_HELPER.auth_url, HINTS.auth_url, HINTS.reauth_url_button, null, url, null),
                    context(SETTINGS_HELPER.auth_confirmation, authStatement(profile.display_name ? profile.display_name : profile.id))
                )
            }
        } catch (error2) {
            if (error2 instanceof AuthError){
                auth_error = true;
                //We are not authenticated.
                blocks.push(
                    buttonSection(SETTINGS_HELPER.auth_url, HINTS.auth_url, HINTS.auth_url_button, null, url, null),
                )
                if (error2.message == PREMIUM_ERROR){
                    blocks.push(
                        context(SETTINGS_HELPER.auth_confirmation, PREMIUM_ERROR)
                    )
                } else if (failed){
                    blocks.push(
                        context(SETTINGS_HELPER.auth_confirmation, AUTH_FAIL)
                    )
                }
            } else {
                throw error2;
            }
        }
        return {
            auth: blocks,
            auth_error: auth_error
        };
    } catch (error) {
        throw error;
    }
}

function authStatement(user){
    return `:white_check_mark: Authenticated with ${user} - Spotify Premium`
}

module.exports = {
    authBlock,
    getAuthorizationURL,
    validateAuthCode
}