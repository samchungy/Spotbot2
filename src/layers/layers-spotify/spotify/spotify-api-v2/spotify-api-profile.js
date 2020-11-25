const config = require('./config');
const requester = require('./spotify-api-requester');

const fetchProfile = (auth) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.me).then((response) => response.data);
  });
};

const fetchUserProfile = async (auth, user) => {
  return requester(auth, (client) => {
    return client.get(config.endpoints.profile(user)).then((response) => response.data);
  });
};

module.exports = {
  fetchProfile,
  fetchUserProfile,
};

