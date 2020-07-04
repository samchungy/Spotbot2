const CONFIG = require(process.env.CONFIG);
const {loadAuth} = require('/opt/db/spotify-auth-interface');

const ACCESS = CONFIG.dynamodb.auth_spotify.access;
const REFRESH = CONFIG.dynamodb.auth_spotify.refresh;
const EXPIRES = CONFIG.dynamodb.auth_spotify.expires;
const PROFILE = CONFIG.dynamodb.auth_spotify.profile;

const authSession = async (teamId, channelId) => {
  const auth = await loadAuth(teamId, channelId);

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
