const config = require('config');
const {spotifyWebApi} = require('./initialise');
const requester = require('./requester');
const COLLABORATIVE = config.get('spotify_api.playlists.collaborative');
const PUBLIC = config.get('spotify_api.playlists.public');

/**
 * Fetches user playlists from Spotify
 * @param {number} offset
 * @param {number} limit
 */
async function fetchPlaylists(offset, limit) {
  const spotifyApi = await spotifyWebApi();
  return await requester('Get All Playlists', () => spotifyApi.getUserPlaylists({limit: limit, offset: offset}));
}

/**
 * Creates a new playlist on Spotify
 * @param {string} profileId
 * @param {string} name
 */
async function createPlaylist(profileId, name) {
  const spotifyApi = await spotifyWebApi();
  return await requester('Create a new playlist', () => spotifyApi.createPlaylist(profileId, name, {collaborative: COLLABORATIVE, public: PUBLIC}));
}

module.exports = {
  createPlaylist,
  fetchPlaylists,
};
