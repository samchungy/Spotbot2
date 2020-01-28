const config = require('config');
const logger = require('../../../util/util-logger');
const BLACKLIST = config.get('dynamodb.blacklist.database');
const {getSetting, putSetting, settingModel} = require('../../../db/settings');


// Load Functions

/**
 * Loads the back to playlist setting from the db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadBlacklist(teamId, channelId) {
  try {
    const setting = settingModel(teamId, channelId, BLACKLIST, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : [];
  } catch (error) {
    logger.error('Loading Blacklist from Dynamodb failed');
    throw error;
  }
}

// Store Functions

/**
 * Loads the back to playlist setting from the db
 * @param {string} teamId
 * @param {string} channelId
 * @param {Array} blacklist
 */
async function storeBlacklist(teamId, channelId, blacklist) {
  try {
    const setting = settingModel(teamId, channelId, BLACKLIST, blacklist);
    return await putSetting(setting);
  } catch (error) {
    logger.error('Loading Back To Playlist from Dynamodb failed');
    throw error;
  }
}

module.exports = {
  loadBlacklist,
  storeBlacklist,
};
