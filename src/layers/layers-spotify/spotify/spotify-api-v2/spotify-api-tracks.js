const config = require('./config');
const requester = require('./spotify-api-requester');
const fetchDevices = (auth) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.devices).then((response) => response.data);
  });
};

const fetchTracksInfo = async (auth, market, ids) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.tracks, {params: {
      ...market && {market},
      ids: ids.join(),
    }}).then((response) => response.data);
  });
};

const fetchArtistTracks = async (auth, country, artistId) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.artistsTracks(artistId), {params: {
      ...country && {country},
    }}).then((response) => response.data);
  });
};

const fetchTrackInfo = async (auth, market, trackId) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.track(trackId), {params: {
      ...market && {market},
    }}).then((response) => response.data);
  });
};


module.exports = {
  fetchArtistTracks,
  fetchDevices,
  fetchTrackInfo,
  fetchTracksInfo,
};

