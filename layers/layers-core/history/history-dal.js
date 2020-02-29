const logger = require(process.env.LOGGER);
const {getHistory, putHistory, historyModel, historyUpdateModel, historyQueryModel, historyValues, queryHistory, updateHistory} = require('/opt/db/history');

/**
 * Load Tracks history from DB
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} id
 * @param {Array} keys
 */
async function loadHistory(teamId, channelId, id, keys) {
  try {
    const history = historyModel(teamId, channelId, id, null);
    const item = await getHistory(history, keys);
    return item.Item ? historyValues(item.Item) : null;
  } catch (error) {
    logger.error('Loading history from Dynamodb failed');
    throw error;
  }
}

/**
 * Store Track History to DB
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} triggerId
 * @param {Object} trackHistory
 * @param {Object} expiry
 */
async function storeHistory(teamId, channelId, triggerId, trackHistory, expiry) {
  try {
    const history = historyModel(teamId, channelId, triggerId, trackHistory, expiry);
    return await putHistory(history);
  } catch (error) {
    logger.error('Storing track history from Dynamodb failed');
    throw error;
  }
}


/**
 * Changes Tracks history from DB
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} triggerId
 * @param {string} query
 * @param {string} queryVal
  * @param {string} queryNames
 */
async function changeHistory(teamId, channelId, triggerId, query, queryVal, queryNames) {
  try {
    const history = historyUpdateModel(teamId, channelId, triggerId, query, queryVal, queryNames);
    return await updateHistory(history);
  } catch (error) {
    logger.error('Changing history in Dynamodb failed');
    throw error;
  }
}

/**
 * Query Dynamodb
 * @param {*} keyConditionExpression
 * @param {*} queryAttributeNames
 * @param {*} queryAttributeValues
 * @param {*} filterExpression
 */
async function searchHistory(keyConditionExpression, queryAttributeNames, queryAttributeValues, filterExpression ) {
  try {
    const history = historyQueryModel(keyConditionExpression, queryAttributeNames, queryAttributeValues, filterExpression);
    return (await queryHistory(history)).Items;
  } catch (error) {
    logger.error('Changing history in Dynamodb failed');
    throw error;
  }
};


module.exports = {
  changeHistory,
  loadHistory,
  searchHistory,
  storeHistory,
};
