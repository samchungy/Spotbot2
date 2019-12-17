const config = require('config');
const SpotifyWebApi = require('spotify-web-api-node');
const SPOTIFY_CLIENT_ID = config.get('spotify_api.client_id');
const SPOTIFY_CLIENT_SECRET = config.get('spotify_api.client_secret');

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
var spotifyApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
});

module.exports = spotifyApi