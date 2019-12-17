const config = require('config');
const logger = require('pino')()
const spotifyWebApi = require('./initialise');
const requester = require('./requester');
const SCOPES = config.get('spotify_api.scopes');

async function createAuthorizeURL(trigger_id, redirect_url){
    try {
        spotifyWebApi.setRedirectURI(redirect_url);
        return await requester("Create Authorize URL", () => spotifyWebApi.createAuthorizeURL(SCOPES, trigger_id));
    } catch (error) {
        throw error;
    }
}

async function requestTokens(code){
    try {
        return await requester("Create Authorize URL", () => spotifyWebApi.authorizationCodeGrant(code).body);
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createAuthorizeURL,
    requestTokens
}