const dynamoDb = require('./db');
const SEARCH_TABLE = process.env.SEARCH_TABLE;

const searchTable = (item) => {
  return {
    TableName: SEARCH_TABLE,
    ...item,
  };
};

const getSearchInfo = (key, keys) => {
  return searchTable({
    Key: key,
    ...keys ? {ProjectionExpression: keys.join(', ')}: {},
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
    ...value ? value : {},
    ...expiry ? {ttl: expiry} : {},
  };
};

const searchUpdateModel = (team, channel, triggerId, expression, expressionValues) => {
  return searchTable({
    Key: {
      triggerId: triggerId,
      team_channel: `${team}-${channel}`,
    },
    UpdateExpression: `${expression}`,
    ExpressionAttributeValues: expressionValues,
  });
};

const searchValues = (item) => {
  // eslint-disable-next-line no-unused-vars, camelcase
  const {triggerId, team_channel, ...results} = item;
  return results;
};


const putSearch = (search) => {
  return dynamoDb.put(searchInfo(search)).promise();
};

const getSearch = (search, keys) => {
  return dynamoDb.get(getSearchInfo(search, keys)).promise();
};

const updateSearch = (search) => {
  return dynamoDb.update(search).promise();
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
  searchUpdateModel,
  searchValues,
  updateSearch,
};
