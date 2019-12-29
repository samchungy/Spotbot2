const config = require('config');
const logger = require('../../util/logger');
const { spotifyWebApi } = require('./initialise');
const requester = require('./requester');
const SCOPES = config.get('spotify_api.scopes');

async function getSpotifyProfile(){
    try {
        let spotifyApi = await spotifyWebApi();
        return (await requester("Get Spotify Profile", () => spotifyApi.getMe())).body;
    } catch (error) {
        throw error;
    }
}

async function createAuthorizeURL(trigger_id){
    try {
        let spotifyApi = await spotifyWebApi();
        return await requester("Create Authorize URL", () => spotifyApi.createAuthorizeURL(SCOPES, trigger_id, true));
    } catch (error) {
        throw error;
    }
}

async function requestTokens(code){
    try {
        let spotifyApi = await spotifyWebApi();
        return (await requester("Authorization Code Grant", () => spotifyApi.authorizationCodeGrant(code))).body;
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

async function testTokens(){
    let spotifyApi = await spotifyWebApi();
    logger.info(spotifyApi.getAccessToken(), spotifyApi.getRefreshToken())
}

module.exports = {
    createAuthorizeURL,
    getSpotifyProfile,
    requestTokens,
    testTokens
}