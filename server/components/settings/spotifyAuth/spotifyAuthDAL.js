const config = require('config');
const logger = require('../../../util/logger');
const {nullOrValue} = require('../../../util/objects');
const {getSetting, putSetting, settingModel} = require('../../../db/settings');

const AUTH = config.get('dynamodb.auth');

// Loading Functions

/**
 * Load stored state from db
 */
async function loadState() {
  try {
    const setting = settingModel(AUTH.state, null);
    const result = await getSetting(setting);
    return result.Item.value;
  } catch (error) {
    logger.error('Get State failed');
    throw error;
  }
}

/**
 * Load spotify auth tokens from db
 */
async function loadTokens() {
  try {
    let access; let refresh;
    const authentication = settingModel(AUTH.object, null);
    const result = await getSetting(authentication);
    if (nullOrValue(result)) {
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
 * Store Spotify Profile in db
 * @param {string} id
 */
async function storeProfile(id) {
  const setting = settingModel(AUTH.spotify_id, id);
  return putSetting(setting);
}

/**
 * Store Spotify Auth State in db
 * @param {string} state
 */
async function storeState(state) {
  const setting = settingModel(AUTH.state, state);
  return putSetting(setting);
}

/**
 * Store the access and refresh tokens in db
 * @param {string} accessToken
 * @param {string} refreshToken
 */
async function storeTokens(accessToken, refreshToken) {
  const authentication = settingModel(AUTH.object, {
    [AUTH.access]: accessToken,
    [AUTH.refresh]: refreshToken,
    [AUTH.expires]: new Date(),
  });
  return putSetting(authentication);
}

module.exports = {
  loadState,
  loadTokens,
  storeProfile,
  storeState,
  storeTokens,
};
