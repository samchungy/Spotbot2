const dynamoDb = require('./db');
const SEARCH_TABLE = process.env.SEARCH_TABLE;

const searchTable = (item) => {
  return {
    TableName: SEARCH_TABLE,
    ...item,
  };
};

const getSearchInfo = (key) => {
  return searchTable({
    Key: key,
  });
};


const searchInfo = (item) => {
  return searchTable(
      {
        Item: item,
      });
};

const searchModel = (team, channel, triggerId, value, expiry) => {
  return {
    triggerId: triggerId,
    team_channel: `${team}-${channel}`,
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

const batchGetSearch = (search) => {
  return dynamoDb.batchGet((search)).promise();
};


const batchGetParams = (keys) => {
  return {
    RequestItems: {
      [SEARCH_TABLE]: {
        Keys: keys,
      },
    },
  };
};

module.exports = {
  batchGetParams,
  batchGetSearch,
  getSearch,
  putSearch,
  searchModel,
};
