const config = require('config');
const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');
const COLLABORATIVE = config.get('spotify_api.playlists.collaborative');
const PUBLIC = config.get('spotify_api.playlists.public');
const LIMIT = config.get('spotify_api.playlists.tracks.limit');

/**
 * Fetches user playlists from Spotify
 * @param {number} offset
 * @param {number} limit
 */
async function fetchPlaylists(offset, limit) {
  const spotifyApi = await spotifyWebApi();
  return (await requester('Get All Playlists', async () => await spotifyApi.getUserPlaylists({limit: limit, offset: offset}))).body;
}

/**
 * Creates a new playlist on Spotify
 * @param {string} profileId
 * @param {string} name
 */
async function createPlaylist(profileId, name) {
  const spotifyApi = await spotifyWebApi();
  return (await requester('Create a new playlist', async () => await spotifyApi.createPlaylist(profileId, name, {collaborative: COLLABORATIVE, public: PUBLIC}))).body;
}

/**
 * Replace tracks in playlist on Spotify
 * @param {string} playlistId
 * @param {Array} uris
 */
async function replaceTracks(playlistId, uris) {
  const spotifyApi = await spotifyWebApi();
  return (await requester('Replace Tracks', async () => await spotifyApi.replaceTracksInPlaylist(playlistId, uris))).body;
}

/**
 * Get Tracks from playlist on Spotify
 * @param {String} playlistId
 * @param {String} market
 * @param {Number} offset
 */
async function fetchTracks(playlistId, market, offset) {
  const spotifyApi = await spotifyWebApi();
  return (await requester('Fetch Tracks', async () => await spotifyApi.getPlaylistTracks(playlistId, {
    limit: LIMIT,
    ...market ? {market: market} : {},
    offset: offset,
    fields: 'items(track(uri,name,artists,explicit,is_playable),added_by.id,added_at)',
  }))).body;
}

/**
 * Get Playlist
 * @param {String} playlistId
 */
async function fetchPlaylistTotal(playlistId) {
  const spotifyApi = await spotifyWebApi();
  return (await requester('Fetch Playlist', async () => await spotifyApi.getPlaylist(playlistId, {
    fields: 'tracks.total',
  }))).body;
}

/**
 * Delete Playlist Tracks
 * @param {String} playlistId
 * @param {Array} trackUris
 */
async function deleteTracks(playlistId, trackUris) {
  console.log(playlistId, trackUris);
  const spotifyApi = await spotifyWebApi();
  return (await requester('Delete playlist tracks', async () => await spotifyApi.removeTracksFromPlaylist(playlistId, trackUris))).body;
}

module.exports = {
  createPlaylist,
  deleteTracks,
  fetchPlaylists,
  fetchPlaylistTotal,
  fetchTracks,
  replaceTracks,
};
