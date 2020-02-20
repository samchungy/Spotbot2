const config = require(process.env.CONFIG);
const {changeAuth, loadAuth, removeAuth, storeAuth} = require('./spotify-auth-dal');

const AUTH = config.dynamodb.auth;

// Loading Functions
const changeSpotifyAuth = (teamId, channelId, values) => changeAuth(teamId, channelId, AUTH.auth, values);

const loadSpotifyAuth = (teamId, channelId, keys) => loadAuth(teamId, channelId, AUTH.auth, keys);
const loadState = (teamId, channelId) => loadAuth(teamId, channelId, AUTH.state);

const removeSpotifyAuth = (teamId, channelId) => removeAuth(teamId, channelId, AUTH.auth);
const removeState = (teamId, channelId) => removeAuth(teamId, channelId, AUTH.state);

const storeSpotifyAuth = (teamId, channelId, value) => storeAuth(teamId, channelId, AUTH.auth, value);
const storeState = (teamId, channelId, value, expiry) => storeAuth(teamId, channelId, AUTH.state, value, expiry);


module.exports = {
  changeSpotifyAuth,
  loadSpotifyAuth,
  loadState,
  removeSpotifyAuth,
  removeState,
  storeSpotifyAuth,
  storeState,
};
