const config = require('config');
const logger = require('../../../util/util-logger');
const {getAuth, putAuth, authModel} = require('../../../db/auth');

const AUTH = config.get('dynamodb.auth');

// Loading Functions

/**
 * Load stored state from db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadState(teamId, channelId ) {
  try {
    const setting = authModel(teamId, channelId, AUTH.state, null);
    const result = await getAuth(setting);
    return result.Item ? result.Item.value : null;
  } catch (error) {
    logger.error('Get State failed');
    throw error;
  }
}

/**
 * Load spotify auth tokens from db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadTokens(teamId, channelId ) {
  try {
    let access; let refresh;
    const authentication = authModel(teamId, channelId, AUTH.object, null);
    const result = await getAuth(authentication);
    if (result.Item) {
      access = result.Item.value[AUTH.access];
      refresh = result.Item.value[AUTH.refresh];
    }
    return {
      accessToken: access,
      refreshToken: refresh,
    };
  } catch (error) {
    logger.error('Get Tokens failed');
    throw error;
  }
}

// Storing Functions

/**
 * Store Spotify Auth State in db
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} state
 */
async function storeState(teamId, channelId, state) {
  const setting = authModel(teamId, channelId, AUTH.state, state);
  return putAuth(setting);
}

/**
 * Store the access and refresh tokens in db
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} accessToken
 * @param {string} refreshToken
 */
async function storeTokens(teamId, channelId, accessToken, refreshToken) {
  const authentication = authModel(teamId, channelId, AUTH.object, {
    [AUTH.access]: accessToken,
    [AUTH.refresh]: refreshToken,
    [AUTH.expires]: new Date(),
  });
  return putAuth(authentication);
}

module.exports = {
  loadState,
  loadTokens,
  storeState,
  storeTokens,
};
