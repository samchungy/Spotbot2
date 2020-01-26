const config = require('config');
const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');
const COLLABORATIVE = config.get('spotify_api.playlists.collaborative');
const PUBLIC = config.get('spotify_api.playlists.public');
const LIMIT = config.get('spotify_api.playlists.tracks.limit');

/**
 * Add tracks to a playlist in Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} playlistId
 * @param {Array} trackUris
 */
async function addTracksToPlaylist(teamId, channelId, playlistId, trackUris) {
  const spotifyApi = await spotifyWebApi(teamId, channelId);
  return (await requester(teamId, channelId, 'Add tracks to playlists', async () => {
    return await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
  }));
}

/**
 * Fetches user playlists from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {number} offset
 * @param {number} limit
 */
async function fetchPlaylists(teamId, channelId, offset, limit) {
  const spotifyApi = await spotifyWebApi(teamId, channelId);
  return (await requester(teamId, channelId, 'Get All Playlists', async () => await spotifyApi.getUserPlaylists({limit: limit, offset: offset}))).body;
}

/**
 * Creates a new playlist on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} profileId
 * @param {string} name
 */
async function createPlaylist(teamId, channelId, profileId, name) {
  const spotifyApi = await spotifyWebApi(teamId, channelId);
  return (await requester(teamId, channelId, 'Create a new playlist', async () => await spotifyApi.createPlaylist(profileId, name, {collaborative: COLLABORATIVE, public: PUBLIC}))).body;
}

/**
 * Replace tracks in playlist on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} playlistId
 * @param {Array} uris
 */
async function replaceTracks(teamId, channelId, playlistId, uris) {
  const spotifyApi = await spotifyWebApi(teamId, channelId);
  return (await requester(teamId, channelId, 'Replace Tracks', async () => await spotifyApi.replaceTracksInPlaylist(playlistId, uris))).body;
}

/**
 * Get Tracks from playlist on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} playlistId
 * @param {String} market
 * @param {Number} offset
 */
async function fetchTracks(teamId, channelId, playlistId, market, offset) {
  const spotifyApi = await spotifyWebApi(teamId, channelId);
  return (await requester(teamId, channelId, 'Fetch Tracks', async () => await spotifyApi.getPlaylistTracks(playlistId, {
    limit: LIMIT,
    ...market ? {market: market} : {},
    offset: offset,
    fields: 'items(track(id,uri,name,artists,explicit,is_playable),added_by.id,added_at)',
  }))).body;
}

/**
 * Get Playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} playlistId
 */
async function fetchPlaylistTotal(teamId, channelId, playlistId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId);
  return (await requester(teamId, channelId, 'Fetch Playlist', async () => await spotifyApi.getPlaylist(playlistId, {
    fields: 'tracks.total',
  }))).body;
}

/**
 * Delete Playlist Tracks
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} playlistId
 * @param {Array} trackUris
 */
async function deleteTracks(teamId, channelId, playlistId, trackUris) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return (await requester(teamId, channelId, 'Delete playlist tracks', async () => await spotifyApi.removeTracksFromPlaylist(playlistId, trackUris))).body;
}

module.exports = {
  addTracksToPlaylist,
  createPlaylist,
  deleteTracks,
  fetchPlaylists,
  fetchPlaylistTotal,
  fetchTracks,
  replaceTracks,
};
