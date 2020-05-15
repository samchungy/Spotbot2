const dynamoDb = require('./db');
const HISTORY_TABLE = process.env.HISTORY_TABLE;
const logger = require(process.env.LOGGER);

const historyTable = (item) => ({
  TableName: HISTORY_TABLE,
  ...item,
});

const historyKey = (teamId, channelId, key) => ({
  team_channel: `${teamId}-${channelId}`,
  id: key,
});

// eslint-disable-next-line no-unused-vars, camelcase
const historyValue = ({team_channel, ...valuesToKeep}) => valuesToKeep;

const getHistory = (teamId, channelId, key) => {
  const item = historyTable({
    Key: historyKey(teamId, channelId, key),
  });
  return dynamoDb.get(item).promise()
      .then((data) => data && data.Item ? historyValue(data.Item) : null)
      .catch((err) => {
        logger.error(`Dynamodb getHistory failed with key ${JSON.stringify(item)} - ${JSON.stringify(err)}`);
        throw err;
      });
};

const putHistory = (teamId, channelId, key, values, expiry) => {
  const item = historyTable({
    Item: {
      ...historyKey(teamId, channelId, key),
      ...values,
      ...expiry ? {ttl: expiry} : {},
    },
  });
  return dynamoDb.put(item).promise()
      .then((data) => data ? Promise.resolve(data) : Promise.reject(data))
      .catch((err) => {
        logger.error(`Dynamodb putHistory failed with key ${JSON.stringify(item)} - ${JSON.stringify(err)}`);
        throw err;
      });
};

const queryHistory = (expressionAttributeNames, expressionAttributeValues, keyConditionExpression, indexName, filterExpression) => {
  const item = historyTable({
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    KeyConditionExpression: keyConditionExpression,
    IndexName: indexName,
    FilterExpression: filterExpression,
  });
  return dynamoDb.query(item).promise()
      .then((data) => data ? data.Items : Promise.reject(data))
      .catch((err) => {
        logger.error(`Dynamodb queryHistory failed with key ${JSON.stringify(item)} - ${JSON.stringify(err)}`);
        throw err;
      });
};

const updateHistory = (teamId, channelId, key, expressionAttributeNames, expressionAttributeValues, updateExpression, conditionExpression, returnValues='NONE') => {
  const item = historyTable({
    Key: historyKey(teamId, channelId, key),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    UpdateExpression: updateExpression,
    ReturnValues: returnValues,
    ...conditionExpression ? {ConditionExpression: conditionExpression} : {},
  });
  return dynamoDb.update(item).promise()
      .catch((err) => {
        logger.error(`Dynamodb updateHistory failed with key ${JSON.stringify(item)} - ${JSON.stringify(err)}`);
        throw err;
      });
};

module.exports = {
  getHistory,
  putHistory,
  queryHistory,
  updateHistory,
};
