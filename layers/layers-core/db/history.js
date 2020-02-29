const dynamoDb = require('./db');
const HISTORY_TABLE = process.env.HISTORY_TABLE;

const historyTable = (item) => {
  return {
    TableName: HISTORY_TABLE,
    ...item,
  };
};

const getHistoryInfo = (key, keys) => {
  return historyTable({
    Key: key,
    ...keys ? {ProjectionExpression: keys.join(', ')}: {},
  });
};


const historyInfo = (item) => {
  return historyTable(
      {
        Item: item,
      });
};

const historyModel = (team, channel, id, value, expiry) => {
  return {
    id: id,
    team_channel: `${team}-${channel}`,
    ...value ? value : {},
    ...expiry ? {ttl: expiry} : {},
  };
};

const historyUpdateModel = (team, channel, id, expression, expressionValues, expressionNames) => {
  return historyTable({
    Key: {
      id: id,
      team_channel: `${team}-${channel}`,
    },
    UpdateExpression: `${expression}`,
    ExpressionAttributeValues: expressionValues,
    ExpressionAttributeNames: expressionNames,
  });
};

const historyQueryModel = (keyConditionExpression, expressionAttributeNames, expressionAttributeValues, filterExpression) => {
  return historyTable({
    IndexName: 'userId-index',
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    FilterExpression: filterExpression,
  });
};

const historyValues = (item) => {
  // eslint-disable-next-line no-unused-vars, camelcase
  const {id, team_channel, ...results} = item;
  return results;
};


const putHistory = (history) => {
  return dynamoDb.put(historyInfo(history)).promise();
};

const getHistory = (history, keys) => {
  return dynamoDb.get(getHistoryInfo(history, keys)).promise();
};

const updateHistory = (history) => {
  return dynamoDb.update(history).promise();
};

const queryHistory = (history) => {
  return dynamoDb.query(history).promise();
};

const batchGetHistory = (history) => {
  return dynamoDb.batchGet((history)).promise();
};


const batchGetParams = (keys) => {
  return {
    RequestItems: {
      [HISTORY_TABLE]: {
        Keys: keys,
      },
    },
  };
};

module.exports = {
  batchGetParams,
  batchGetHistory,
  getHistory,
  putHistory,
  historyQueryModel,
  historyModel,
  historyUpdateModel,
  historyValues,
  queryHistory,
  updateHistory,
};
