const config = require('./config');
const requester = require('./spotify-api-requester');
const qs = require('qs');

const fetchDevices = (auth) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.devices).then((response) => response.data);
  });
};

const fetchTracksInfo = async (auth, market, ids) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.tracks, qs.stringify({
      ...market && {market},
      ids,
    })).then((response) => response.data);
  });
};

const fetchArtistTracks = async (auth, country, artistId) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.artistsTracks(artistId), qs.stringify({
      ...country && {country},
    })).then((response) => response.data);
  });
};

const fetchTrackInfo = async (auth, market, trackId) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.track(trackId), qs.stringify({
      ...market && {market},
    })).then((response) => response.data);
  });
};


module.exports = {
  fetchArtistTracks,
  fetchDevices,
  fetchTrackInfo,
  fetchTracksInfo,
};

