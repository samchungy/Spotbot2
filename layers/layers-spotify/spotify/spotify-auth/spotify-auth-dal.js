const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {getAuth, putAuth, authModel} = require('/opt/db/auth');

const AUTH = config.dynamodb.auth;
const VIEW = config.dynamodb.auth.view_id;

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
    let access; let refresh; let expires;
    const authentication = authModel(teamId, channelId, AUTH.object, null);
    const result = await getAuth(authentication);
    if (result.Item) {
      access = result.Item.value[AUTH.access];
      refresh = result.Item.value[AUTH.refresh];
      expires = result.Item.value[AUTH.expires];
    }
    return {
      accessToken: access,
      refreshToken: refresh,
      expires: expires,
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
 * @param {string} date
 */
async function storeTokens(teamId, channelId, accessToken, refreshToken, date) {
  const authentication = authModel(teamId, channelId, AUTH.object, {
    [AUTH.access]: accessToken,
    [AUTH.refresh]: refreshToken,
    [AUTH.expires]: date,
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
