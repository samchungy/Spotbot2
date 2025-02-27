const config = require('./config');
const requester = require('./spotify-api-requester');
const LIMIT = config.limits.playlistTracks;

const addTracksToPlaylist = async (auth, playlistId, uris) => {
  return requester(auth, (client) => {
    return client.post(config.endpoints.playlistItems(playlistId), {
      uris,
    }).then((response) => response.data);
  });
};

const fetchPlaylistTotal = async (auth, playlistId) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.playlistItems(playlistId), {params: {
      fields: 'total',
    }}).then((response) => response.data);
  });
};

const fetchPlaylists = (auth, offset, limit) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.playlists, {params: {
      offset,
      limit,
    }}).then((response) => response.data);
  });
};

const createPlaylist = async (auth, profileId, name, collaborative, public) => {
  return requester(auth, (client) => {
    return client.post(config.endpoints.createPlaylist(profileId), {
      name,
      collaborative,
      public,
    }).then((response) => response.data);
  });
};

const fetchTracks = async (auth, playlistId, market, offset, limit) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.playlistItems(playlistId), {params: {
      ...limit ? {limit} : {limit: LIMIT},
      ...market && {market},
      ...offset && {offset},
      fields: 'items(track(id,uri,name,artists,explicit,is_playable),added_by.id,added_at)',
    }}).then((response) => response.data);
  });
};

const deleteTracks = async (auth, playlistId, tracks) => {
  return requester(auth, (client) => {
    return client.delete(config.endpoints.playlistItems(playlistId), {
      data: {tracks},
    }).then((response) => response.data);
  });
};

const replaceTracks = async (auth, playlistId, uris) => {
  return requester(auth, (client) => {
    return client.put(config.endpoints.playlistItems(playlistId), {
      uris,
    }).then((response) => response.data);
  });
};

const getPlaylist = async (auth, playlistId) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.getPlaylist(playlistId), {params: {
      fields: 'name,uri,id,external_urls.spotify',
    }}).then((response) => response.data);
  });
};

module.exports = {
  addTracksToPlaylist,
  createPlaylist,
  deleteTracks,
  fetchPlaylists,
  fetchPlaylistTotal,
  fetchTracks,
  getPlaylist,
  replaceTracks,
};

