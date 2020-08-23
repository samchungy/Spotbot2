const {getSearch, putSearch, updateSearch} = require('./search-dal');

const removeThreeSearches = (teamId, channelId, triggerId) => {
  const expressionNames = {
    '#CurrentSearch': 'currentSearch',
    '#SearchItems': 'searchItems',
  };
  const expressionValues = {':inc': 1};
  const updateExpression = 'remove #SearchItems[0], #SearchItems[1], #SearchItems[2] set #CurrentSearch = #CurrentSearch + :inc';
  return updateSearch(teamId, channelId, triggerId, expressionNames, expressionValues, updateExpression);
};

const loadSearch = (teamId, channelId, triggerId) => {
  const expressionNames = {
    '#SearchItems': 'searchItems',
    '#NumSearches': 'numSearches',
    '#CurrentSearch': 'currentSearch',
  };
  const projectionExpression = '#SearchItems[0], #SearchItems[1], #SearchItems[2], #NumSearches, #CurrentSearch';
  return getSearch(teamId, channelId, triggerId, expressionNames, projectionExpression);
};
const storeSearch = (teamId, channelId, triggerId, search, expiry) => putSearch(teamId, channelId, triggerId, search, expiry);

const modelSearch = (items, query, current) => ({
  numSearches: Math.ceil(items.length/3) + current,
  currentSearch: current,
  searchItems: items,
  searchQuery: query,
});

module.exports = {
  modelSearch,
  removeThreeSearches,
  loadSearch,
  storeSearch,
};
