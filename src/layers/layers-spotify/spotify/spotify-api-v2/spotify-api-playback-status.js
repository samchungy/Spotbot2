const config = require('./config');
const requester = require('./spotify-api-requester');

const fetchCurrentPlayback = async (auth, market) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.player, {params: {
      market,
    }}).then((response) => response.data);
  });
};

const fetchRecent = async (auth, limit) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.recent, {params: {
      limit,
    }}).then((response) => response.data);
  });
};

module.exports = {
  fetchCurrentPlayback,
  fetchRecent,
};
