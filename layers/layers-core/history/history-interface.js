const {searchHistory, changeHistory, loadHistory, storeHistory} = require('./history-dal');

const changeTrackHistory = (teamId, channelId, id, query, queryVal, queryNames) => changeHistory(teamId, channelId, id, query, queryVal, queryNames);
const loadTrackHistory = (teamId, channelId, id, items) => loadHistory(teamId, channelId, id, items);
const storeTrackHistory = (teamId, channelId, id, value, expiry) => storeHistory(teamId, channelId, id, value, expiry);
const queryUserTrackHistory = (userTrackKeyConditionExpression, userTrackQueryAttributeNames, userTrackQueryAttributeValues, userTrackFilterExpression) => searchHistory(userTrackKeyConditionExpression, userTrackQueryAttributeNames, userTrackQueryAttributeValues, userTrackFilterExpression);

module.exports = {
  changeTrackHistory,
  loadTrackHistory,
  queryUserTrackHistory,
  storeTrackHistory,
};
