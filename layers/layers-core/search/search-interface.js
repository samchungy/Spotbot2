const {getSearch, putSearch, updateSearch} = require('/opt/db/search-dal');

const removeThreeSearches = (teamId, channelId, triggerId) => {
  const expressionNames = {
    '#CurrentSearch': 'currentSearch',
    '#SearchItems': 'searchItems',
  };
  const expressionValues = {':inc': 1};
  const updateExpression = 'remove #SearchItems[0], #SearchItems[1], #SearchItems[2] set #CurrentSearch = #CurrentSearch + :inc';
  return updateSearch(teamId, channelId, triggerId, expressionNames, expressionValues, updateExpression);
};

const loadSearch = (teamId, channelId, triggerId, items) => getSearch(teamId, channelId, triggerId, items);
const storeSearch = (teamId, channelId, triggerId, search, query, expiry) => putSearch(teamId, channelId, triggerId, modelSearch(search, query), expiry);

const modelSearch = (items, query) => ({
  numSearches: items && items.length ? Math.ceil(items.length/3) : 0,
  currentSearch: 0,
  searchItems: items,
  searchQuery: query,
});

module.exports = {
  removeThreeSearches,
  loadSearch,
  storeSearch,
};
