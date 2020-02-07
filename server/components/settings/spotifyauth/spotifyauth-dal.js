const config = require('config');
const logger = require('../../../util/util-logger');
const {getAuth, putAuth, authModel} = require('../../../db/auth');

const AUTH = config.get('dynamodb.auth');
const VIEW = config.get('dynamodb.auth.view_id');

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

/**
 * Load stored View from db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadView(teamId, channelId ) {
  try {
    const setting = authModel(teamId, channelId, VIEW, null);
    const item = await getAuth(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading view from Dynamodb failed');
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

/**
 * Stores a model object in db
 * @param {string} teamId
 * @param {string} channelId
 * @param {modelView} view
 */
async function storeView(teamId, channelId, view) {
  try {
    const setting = authModel(teamId, channelId, VIEW, view);
    return await putAuth(setting);
  } catch (error) {
    logger.error('Storing view to Dynamodb failed');
    throw error;
  }
}

module.exports = {
  loadState,
  loadTokens,
  loadView,
  storeState,
  storeTokens,
  storeView,
};
