const logger = require(process.env.LOGGER);
const {authValues, getAuth, putAuth, authModel, authUpdateModel, updateAuth, authDeleteModel, deleteAuth} = require('/opt/db/auth');

// Loading Functions

/**
 * Load auth
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} authKey
 */
async function loadAuth(teamId, channelId, authKey) {
  try {
    const auth = authModel(teamId, channelId, authKey, null);
    const item = await getAuth(auth);
    return item.Item ? authValues(item.Item) : null;
  } catch (error) {
    logger.error(`Get ${authKey} failed`);
    throw error;
  }
}

/**
 * Store Auth
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} authKey
 * @param {*} value
 * @param {string} expiry
 */
async function storeAuth(teamId, channelId, authKey, value, expiry) {
  try {
    const auth = authModel(teamId, channelId, authKey, value, expiry);
    return await putAuth(auth);
  } catch (error) {
    logger.error(`Storing ${authKey} from Dynamodb failed`);
    throw error;
  }
}

/**
 * Change Auth
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} authKey
 * @param {*} values
 */
async function changeAuth(teamId, channelId, authKey, values) {
  try {
    const auth = authUpdateModel(teamId, channelId, authKey, values);
    return await updateAuth(auth);
  } catch (error) {
    logger.error(`Changing ${authKey} in Dynamodb failed`);
    throw error;
  }
}

/**
 * Remove Auth
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} authKey
 */
async function removeAuth(teamId, channelId, authKey) {
  try {
    const auth = authDeleteModel(teamId, channelId, authKey);
    return await deleteAuth(auth);
  } catch (error) {
    logger.error(`Removing ${authKey} in Dynamodb failed`);
    throw error;
  }
}

module.exports = {
  changeAuth,
  loadAuth,
  removeAuth,
  storeAuth,
};
