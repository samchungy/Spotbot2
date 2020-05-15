const {getAuth, deleteAuth, putAuth, updateAuth} = require('./auth-dal');

const CONFIG = require(process.env.CONFIG);

const MAIN_KEY = CONFIG.dynamodb.auth_spotify.key;
const ACCESS_TOKEN = CONFIG.dynamodb.auth_spotify.access;
const REFRESH_TOKEN = CONFIG.dynamodb.auth_spotify.refresh;
const EXPIRES = CONFIG.dynamodb.auth_spotify.expires;
const STATE = CONFIG.dynamodb.auth_spotify.state;
const PROFILE = CONFIG.dynamodb.auth_spotify.profile;

const changeProfile = (team, channel, id, country) => {
  const expressionNames = {'#Profile': PROFILE};
  const expressionValues = {':profile': modelProfile(id, country)};
  const updateExpression = 'set #Profile = :profile';
  return updateAuth(team, channel, MAIN_KEY, expressionNames, expressionValues, updateExpression);
};

const changeTokens = (team, channel, accessToken, expires) => {
  const expressionNames = {
    '#Access': ACCESS_TOKEN,
    '#Expires': EXPIRES,
  };
  const expressionValues = {
    ':access': accessToken,
    ':expires': expires,
  };
  const updateExpression = 'set #Access = :access, #Expires = :expires';
  const conditionExpression = '#Expires < :expires'; // Race Condition Checker
  return updateAuth(team, channel, MAIN_KEY, expressionNames, expressionValues, updateExpression, conditionExpression);
};

const loadAuth = (teamId, channelId) => getAuth(teamId, channelId, MAIN_KEY);
const loadState = (teamId, channelId) => getAuth(teamId, channelId, STATE);

const storeAuth = (teamId, channelId, accessToken, refreshToken, expires) => putAuth(teamId, channelId, MAIN_KEY, modelAuth(accessToken, refreshToken, expires));
const storeState = (teamId, channelId, value, expiry) => putAuth(teamId, channelId, STATE, value, expiry);

const removeAuth = (teamId, channelId) => deleteAuth(teamId, channelId, MAIN_KEY);
const removeState = (teamId, channelId) => deleteAuth(teamId, channelId, STATE);

const modelAuth = (accessToken, refreshToken, expires) => ({
  [ACCESS_TOKEN]: accessToken,
  [REFRESH_TOKEN]: refreshToken,
  [EXPIRES]: expires,
  [PROFILE]: null,
});

const modelProfile = (id, country) => ({
  country: country,
  id: id,
});

const modelState = (teamId, channelId, viewId) => ({
  teamId: teamId,
  channelId: channelId,
  viewId: viewId,
});

module.exports = {
  modelAuth,
  modelProfile,
  modelState,
  changeProfile,
  changeTokens,
  loadAuth,
  loadState,
  storeAuth,
  storeState,
  removeAuth,
  removeState,
};
