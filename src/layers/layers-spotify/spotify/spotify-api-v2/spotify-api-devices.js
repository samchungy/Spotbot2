const config = require('./config');
const requester = require('./spotify-api-requester');

const fetchDevices = (auth) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.devices).then((response) => response.data);
  });
};

module.exports = {
  fetchDevices,
};

