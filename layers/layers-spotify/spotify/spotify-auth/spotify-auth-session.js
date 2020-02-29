const config = require(process.env.CONFIG);
const {loadSpotifyAuth} = require('./spotify-auth-interface');

const ACCESS = config.dynamodb.auth.access;
const REFRESH = config.dynamodb.auth.refresh;
const EXPIRES = config.dynamodb.auth.expires;
const PROFILE = config.dynamodb.auth.profile;

const authSession = async (teamId, channelId, profile) => {
  const auth = await loadSpotifyAuth(teamId, channelId);
  const updateAuth = (access, expires) => {
    auth[ACCESS] = access;
    auth[EXPIRES] = expires;
  };
  return {
    getAccess: () => auth ? auth[ACCESS] : null,
    getRefresh: () => auth ? auth[REFRESH]: null,
    getExpires: () => auth ? auth[EXPIRES]: null,
    getProfile: () => auth ? auth[PROFILE]: null,
    update: (access, expires) => updateAuth(access, expires),
  };
};

module.exports = {
  authSession,
};
