const config = require('./config');
const qs = require('qs');
const requester = require('./spotify-api-requester');

const fetchCurrentPlayback = async (auth, market) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.player, qs.stringify({market})).then((response) => response.data);
  });
};

const fetchRecent = async (auth, limit) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.recent, qs.stringify({limit})).then((response) => response.data);
  });
};

module.exports = {
  fetchCurrentPlayback,
  fetchRecent,
};
