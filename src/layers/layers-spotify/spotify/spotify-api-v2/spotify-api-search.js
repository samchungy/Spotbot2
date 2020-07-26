const config = require('./config');
const requester = require('./spotify-api-requester');
const qs = require('qs');

const fetchSearchTracks = async (auth, query, market, limit) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.search, qs.stringify({
      q: query,
      type: 'track',
      ...market && {market},
      ...limit && {limit},
    })).then((response) => response.data);
  });
};

const fetchArtists = async (auth, query, market, limit) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.search, qs.stringify({
      q: query,
      type: 'artist',
      ...market && {market},
      ...limit && {limit},
    })).then((response) => response.data);
  });
};

module.exports = {
  fetchArtists,
  fetchSearchTracks,
};
