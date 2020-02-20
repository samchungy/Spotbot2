const config = require(process.env.CONFIG);
const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');
const COLLABORATIVE = config.spotify_api.playlists.collaborative;
const PUBLIC = config.spotify_api.playlists.public;
const LIMIT = config.spotify_api.playlists.tracks.limit;

/**
 * Add tracks to a playlist in Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} playlistId
 * @param {Array} trackUris
 */
async function addTracksToPlaylist(teamId, channelId, auth, playlistId, trackUris) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Add tracks to playlists', async () => {
    return await spotifyApi.addTracksToPlaylist(playlistId, trackUris);
  }));
}

/**
 * Fetches user playlists from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {number} offset
 * @param {number} limit
 */
async function fetchPlaylists(teamId, channelId, auth, offset, limit) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Get All Playlists', async () => await spotifyApi.getUserPlaylists({limit: limit, offset: offset}))).body;
}

/**
 * Creates a new playlist on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} profileId
 * @param {string} name
 */
async function createPlaylist(teamId, channelId, auth, profileId, name) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Create a new playlist', async () => await spotifyApi.createPlaylist(profileId, name, {collaborative: COLLABORATIVE, public: PUBLIC}))).body;
}

/**
 * Replace tracks in playlist on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} playlistId
 * @param {Array} uris
 */
async function replaceTracks(teamId, channelId, auth, playlistId, uris) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Replace Tracks', async () => await spotifyApi.replaceTracksInPlaylist(playlistId, uris))).body;
}

/**
 * Get Tracks from playlist on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {String} playlistId
 * @param {String} market
 * @param {Number} offset
 * @param {Number} limit
 */
async function fetchTracks(teamId, channelId, auth, playlistId, market, offset, limit) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Fetch Tracks', async () => await spotifyApi.getPlaylistTracks(playlistId, {
    ...limit ? {limit: limit} : {limit: LIMIT},
    ...market ? {market: market} : {},
    offset: offset,
    fields: 'items(track(id,uri,name,artists,explicit,is_playable),added_by.id,added_at)',
  }))).body;
}

/**
 * Get Playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {String} playlistId
 */
async function fetchPlaylistTotal(teamId, channelId, auth, playlistId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Fetch Playlist', async () => await spotifyApi.getPlaylist(playlistId, {
    fields: 'tracks.total',
  }))).body;
}

/**
 * Delete Playlist Tracks
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {String} playlistId
 * @param {Array} trackUris
 */
async function deleteTracks(teamId, channelId, auth, playlistId, trackUris) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
  return (await requester(teamId, channelId, auth, 'Delete playlist tracks', async () => await spotifyApi.removeTracksFromPlaylist(playlistId, trackUris))).body;
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
