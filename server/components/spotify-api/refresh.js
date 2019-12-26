const { spotifyWebApi } = require('./initialise');
const { storeTokens } = require('../spotify-auth/spotifyAuthDAL');

async function refreshAccessToken(){
    try {
        let spotifyApi = await spotifyWebApi();
        let token = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(token.body.access_token);
        await storeTokens(token.body.access_token, spotifyApi.getRefreshToken());
    } catch (error) {
        throw error;
    }
}

module.exports = { 
    refreshAccessToken
}