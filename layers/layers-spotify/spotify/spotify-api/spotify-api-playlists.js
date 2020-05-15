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
const addTracksToPlaylist = async (teamId, channelId, auth, playlistId, trackUris) => {
  return await requester(teamId, channelId, auth, 'Add tracks to playlists', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    return spotifyApi.addTracksToPlaylist(playlistId, trackUris)
        .then((data) => data.body);
  });
};

/**
 * Fetches user playlists from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {number} offset
 * @param {number} limit
 */
const fetchPlaylists = async (teamId, channelId, auth, offset, limit) => {
  return await requester(teamId, channelId, auth, 'Get All Playlists', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    return spotifyApi.getUserPlaylists({limit: limit, offset: offset})
        .then((data) => data.body);
  });
};

/**
 * Creates a new playlist on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} profileId
 * @param {string} name
 */
const createPlaylist = async (teamId, channelId, auth, profileId, name) => {
  return await requester(teamId, channelId, auth, 'Create a new playlist', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    return spotifyApi.createPlaylist(profileId, name, {collaborative: COLLABORATIVE, public: PUBLIC})
        .then((data) => data.body);
  });
};

/**
 * Replace tracks in playlist on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} playlistId
 * @param {Array} uris
 */
const replaceTracks = async (teamId, channelId, auth, playlistId, uris) => {
  return await requester(teamId, channelId, auth, 'Replace Tracks', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    await spotifyApi.replaceTracksInPlaylist(playlistId, uris)
        .then((data) => data.body);
  });
};

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
const fetchTracks = async (teamId, channelId, auth, playlistId, market, offset, limit) => {
  return await requester(teamId, channelId, auth, 'Fetch Tracks', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    return spotifyApi.getPlaylistTracks(playlistId, {
      ...limit ? {limit: limit} : {limit: LIMIT},
      ...market ? {market: market} : {},
      offset: offset,
      fields: 'items(track(id,uri,name,artists,explicit,is_playable),added_by.id,added_at)',
    }).then((data) => data.body);
  });
};

/**
 * Get Playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {String} playlistId
 */
const fetchPlaylistTotal = async (teamId, channelId, auth, playlistId) => {
  return await requester(teamId, channelId, auth, 'Fetch Playlist', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    return spotifyApi.getPlaylist(playlistId, {
      fields: 'tracks.total',
    }).then((data) => data.body);
  });
};

/**
 * Delete Playlist Tracks
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {String} playlistId
 * @param {Array} trackUris
 */
const deleteTracks = async (teamId, channelId, auth, playlistId, trackUris) => {
  return await requester(teamId, channelId, auth, 'Delete playlist tracks', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
    return spotifyApi.removeTracksFromPlaylist(playlistId, trackUris)
        .then((data) => data.body);
  });
};

module.exports = {
  addTracksToPlaylist,
  createPlaylist,
  deleteTracks,
  fetchPlaylists,
  fetchPlaylistTotal,
  fetchTracks,
  replaceTracks,
};
