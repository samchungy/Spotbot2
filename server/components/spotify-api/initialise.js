const config = require('config');
const logger = require('../../util/logger');
const SpotifyWebApi = require('spotify-web-api-node');
const { getTokens } = require('../spotify-auth/spotifyAuthDAL');
const SPOTIFY_CLIENT_ID = config.get('spotify_api.client_id');
const SPOTIFY_CLIENT_SECRET = config.get('spotify_api.client_secret');
const SPOTIFY_REDIRECT_URI = config.get('spotify_api.redirect_url');

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
var spotifyApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    redirectUri: SPOTIFY_REDIRECT_URI
});

async function setTokens(){
    let { access_token, refresh_token } = await getTokens();
    console.log(access_token, refresh_token);
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token); 
    return spotifyApi;
}

module.exports = { spotifyWebApi: setTokens }