const logger = require('../../../layers/config/util-logger');
const {batchGetSearch, batchGetParams, getSearch, putSearch, searchModel} = require('../../../layers/db/search');


/**
 * Store Track Search to DB
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} triggerId
 * @param {Object} trackSearch
 * @param {Object} expiry
 */
async function storeSearch(teamId, channelId, triggerId, trackSearch, expiry) {
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
async function loadSearch(teamId, channelId, triggerId) {
  try {
    const search = searchModel(teamId, channelId, triggerId, null);
    const item = await getSearch(search);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading track search from Dynamodb failed');
    throw error;
  }
}

/**
 * Batch Load Tracks search from DB
 * @param {string} teamId
 * @param {string} channelId
 * @param {array} triggerIds
 */
async function batchLoadSearch(teamId, channelId, triggerIds) {
  try {
    let params = batchGetParams(triggerIds.map((triggerId) => searchModel(teamId, channelId, triggerId, null)));
    let unprocessedEmpty = true;
    const results = [];
    while (unprocessedEmpty) {
      const {Responses: searches, UnprocessedKeys} = await batchGetSearch(params);
      unprocessedEmpty = Object.entries(UnprocessedKeys).length === 0 && UnprocessedKeys.constructor === Object;
      if (unprocessedEmpty) {
        for (const table in searches) {
          if ({}.hasOwnProperty.call(searches, table)) {
            results.push(searches[table]);
            unprocessedEmpty = false;
          }
        }
      } else {
        for (const table in searches) {
          if ({}.hasOwnProperty.call(searches, table)) {
            params = searches[table].Keys;
          }
        }
      }
    }
    return results.flat();
  } catch (error) {
    logger.error('Batch loading track search from Dynamodb failed');
    throw error;
  }
}


module.exports = {
  batchLoadSearch,
  loadSearch,
  storeSearch,
};
