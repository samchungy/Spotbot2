const config = require('config');
const logger = require('pino')()
const { spotifyWebApi } = require('./initialise');
const requester = require('./requester');
const SCOPES = config.get('spotify_api.scopes');

async function createAuthorizeURL(trigger_id){
    try {
        let spotifyApi = await spotifyWebApi();
        return await requester("Create Authorize URL", () => spotifyApi.createAuthorizeURL(SCOPES, trigger_id));
    } catch (error) {
        throw error;
    }
}

async function requestTokens(code){
    try {
        let spotifyApi = await spotifyWebApi();
        return (await requester("Authorization Code Grant", () => spotifyApi.authorizationCodeGrant(code))).body;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function testTokens(){
    let spotifyApi = await spotifyWebApi();
    logger.info(spotifyApi.getAccessToken(), spotifyApi.getRefreshToken())
}

module.exports = {
    createAuthorizeURL,
    requestTokens,
    testTokens
}