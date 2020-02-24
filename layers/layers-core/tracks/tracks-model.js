const modelHistory = (uri, userId, time) => {
  return {
    uri: uri,
    userId: userId,
    time: time,
  };
};

modelSearch = (items, query) => {
  return {
    numSearches: items && items.length ? Math.ceil(items.length/3) : 0,
    currentSearch: 0,
    searchItems: items,
    searchQuery: query,
  };
};

const loadQuery = ['numSearches', 'currentSearch', 'searchItems[0]', 'searchItems[1]', 'searchItems[2]', 'searchQuery'];
const changeQuery = `REMOVE searchItems[0], searchItems[1], searchItems[2] SET currentSearch = currentSearch + :inc`;
const changeQueryValue = {':inc': 1};


module.exports = {
  changeQuery,
  changeQueryValue,
  loadQuery,
  modelHistory,
  modelSearch,
};
