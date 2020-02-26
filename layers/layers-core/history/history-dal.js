const logger = require(process.env.LOGGER);
const {getHistory, putHistory, historyModel, historyUpdateModel, historyValues, updateHistory} = require('/opt/db/history');

// /**
// * Batch Load Tracks history from DB
// * @param {string} teamId
// * @param {string} channelId
// * @param {array} triggerIds
// */
// async function batchLoadHistory(teamId, channelId, triggerIds) {
//   try {
//     let params = batchGetParams(triggerIds.map((triggerId) => historyModel(teamId, channelId, triggerId, null)));
//     let unprocessedEmpty = true;
//     const results = [];
//     while (unprocessedEmpty) {
//       const {Responses: historyes, UnprocessedKeys} = await batchGetHistory(params);
//       unprocessedEmpty = Object.entries(UnprocessedKeys).length === 0 && UnprocessedKeys.constructor === Object;
//       if (unprocessedEmpty) {
//         for (const table in historyes) {
//           if ({}.hasOwnProperty.call(historyes, table)) {
//             results.push(historyes[table]);
//             unprocessedEmpty = false;
//           }
//         }
//       } else {
//         for (const table in historyes) {
//           if ({}.hasOwnProperty.call(historyes, table)) {
//             params = historyes[table].Keys;
//           }
//         }
//       }
//     }
//     return results.flat();
//   } catch (error) {
//     logger.error('Batch loading track history from Dynamodb failed');
//     throw error;
//   }
// }

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


module.exports = {
  changeHistory,
  loadHistory,
  storeHistory,
};
