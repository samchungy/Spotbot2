const {queryHistory, updateHistory, getHistory, putHistory} = require('./history-dal');

const changeTrackHistory = (teamId, channelId, trackId, userId, timeAdded, expiry) => {
  const expressionNames = {
    '#Ttl': 'ttl',
    '#UserId': 'userId',
    '#NumAdds': 'numAdds',
    '#TimeAdded': 'timeAdded',
  };
  const expressionValues = {
    ':ttl': expiry,
    ':userId': userId,
    ':timeAdded': timeAdded,
    ':inc': 1,
  };
  const updateExpression = 'SET #Ttl = :ttl, #UserId = :userId, #TimeAdded = :timeAdded, #NumAdds = #NumAdds + :inc';
  return updateHistory(teamId, channelId, trackId, expressionNames, expressionValues, updateExpression);
};

const loadTrackHistory = (teamId, channelId, id) => getHistory(teamId, channelId, id);
const storeTrackHistory = (teamId, channelId, id, artistsIds, userId, timeAdded, expiry) => putHistory(teamId, channelId, id, modelHistory(artistsIds, userId, timeAdded), expiry);

/**
 * Takes a userId and returns any tracks which match
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string[]} trackIds
 * @return {Promise}
 */
const searchUserTrackHistory = (teamId, channelId, userId, trackIds) => {
  const expressionNames = {
    '#Id': 'id',
    '#UserId': 'userId',
    '#TeamChannel': 'team_channel',
  };
  const expressionValues = {
    ':teamChannel': `${teamId}-${channelId}`,
    ':userId': userId,
    ...trackIds.reduce((vals, id, index) => (vals[`:id${index}`] = id, vals), {}), // Generates {:id1 = id} etc
  };
  const conditionExpression = '#TeamChannel=:teamChannel and #UserId=:userId';
  const indexName = 'userId-index';
  const filterExpression = `#Id in (${trackIds.map((id, index) => `:id${index}`).join(', ')})`; // Generates #Id in (:id0, :id1) etc
  return queryHistory(expressionNames, expressionValues, conditionExpression, indexName, filterExpression);
};

const modelHistory = (artistsIds, userId, timeAdded) => ({
  artistsIds: artistsIds,
  userId: userId,
  timeAdded: timeAdded,
  numAdds: 1,
});

module.exports = {
  changeTrackHistory,
  loadTrackHistory,
  searchUserTrackHistory,
  storeTrackHistory,
};
