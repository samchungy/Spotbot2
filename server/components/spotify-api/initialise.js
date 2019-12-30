const config = require('config');
const SpotifyWebApi = require('spotify-web-api-node');
const {loadTokens} = require('../settings/spotifyAuth/spotifyAuthDAL');

const SPOTIFY_CLIENT_ID = config.get('spotify_api.client_id');
const SPOTIFY_CLIENT_SECRET = config.get('spotify_api.client_secret');
const SPOTIFY_REDIRECT_URI = config.get('spotify_api.redirect_url');

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI,
});

/**
 * Sets tokens in the Spotify Api object.
 */
async function setTokens() {
  const {accessToken, refreshToken} = await loadTokens();
  console.log(accessToken, refreshToken);
  spotifyApi.setAccessToken(accessToken);
  spotifyApi.setRefreshToken(refreshToken);
  return spotifyApi;
}

module.exports = {spotifyWebApi: setTokens};
