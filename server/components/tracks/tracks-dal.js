const config = require('config');
const logger = require('../../util/util-logger');
const {getSearch, putSearch, searchModel} = require('../../db/search');


/**
 * Store Track Search to DB
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} triggerId
 * @param {Object} trackSearch
 * @param {Object} expiry
 */
async function storeTrackSearch(teamId, channelId, triggerId, trackSearch, expiry) {
  try {
    const search = searchModel(teamId, channelId, triggerId, trackSearch, expiry);
    return await putSearch(search);
  } catch (error) {
    logger.error('Storing track search from Dynamodb failed');
    throw error;
  }
}

/**
 * Load Tracks search from DB
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} triggerId
 */
async function loadTrackSearch(teamId, channelId, triggerId) {
  try {
    const search = searchModel(teamId, channelId, triggerId, null);
    const item = await getSearch(search);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading track search from Dynamodb failed');
    throw error;
  }
}


module.exports = {
  loadTrackSearch,
  storeTrackSearch,
};
