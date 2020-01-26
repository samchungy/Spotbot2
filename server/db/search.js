const dynamoDb = require('./db');
const SETTINGS_TABLE = process.env.SEARCH_TABLE;

const searchSet = (item) => {
  return {
    TableName: SETTINGS_TABLE,
    ...item,
  };
};

const getSearchInfo = (key) => {
  return searchSet({
    Key: key,
  });
};


const searchInfo = (item) => {
  return searchSet(
      {
        Item: item,
      });
};

const searchModel = (team, channel, triggerId, value, expiry) => {
  return {
    triggerId: triggerId,
    team_channel: team+channel,
    ...value ? {value: value} : {},
    ...expiry ? {ttl: expiry} : {},
  };
};

const putSearch = (search) => {
  return dynamoDb.put(searchInfo(search)).promise();
};

const getSearch = (search) => {
  return dynamoDb.get(getSearchInfo(search)).promise();
};


module.exports = {
  getSearch,
  putSearch,
  searchModel,
  searchInfo,
};
