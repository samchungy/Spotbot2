const dynamoDb = require('./db');
const AUTH_TABLE = process.env.AUTH_TABLE;
const logger = require(process.env.LOGGER);

const authTable = (item) => ({
  TableName: AUTH_TABLE,
  ...item,
});

const authKey = (teamId, channelId, key) => ({
  team_channel: `${teamId}-${channelId}`,
  name: key,
});

// eslint-disable-next-line no-unused-vars, camelcase
const authValue = ({team_channel, name, ...valuesToKeep}) => valuesToKeep;

const getAuth = (teamId, channelId, key) => {
  const item = authTable({
    Key: authKey(teamId, channelId, key),
  });
  return dynamoDb.get(item).promise()
      .then((data) => data && data.Item ? authValue(data.Item) : null)
      .catch((error) => {
        logger.error(error, `Dynamodb getAuth failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

const putAuth = (teamId, channelId, key, values, expiry) => {
  const item = authTable({
    Item: {
      ...authKey(teamId, channelId, key),
      ...values,
      ...expiry ? {ttl: expiry} : {},
    },
  });
  return dynamoDb.put(item).promise()
      .then((data) => data ? Promise.resolve(data) : Promise.reject(data))
      .catch((error) => {
        logger.error(error, `Dynamodb putAuth failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

const deleteAuth = (teamId, channelId, key) => {
  const item = authTable({
    Key: authKey(teamId, channelId, key),
  });
  return dynamoDb.delete(item).promise()
      .catch((error) => {
        logger.error(error, `Dynamodb deleteAuth failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

const updateAuth = (teamId, channelId, key, expressionAttributeNames, expressionAttributeValues, updateExpression, conditionExpression) => {
  const item = authTable({
    Key: authKey(teamId, channelId, key),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    UpdateExpression: updateExpression,
    ...conditionExpression ? {ConditionExpression: conditionExpression} : {},
  });
  return dynamoDb.update(item).promise()
      .catch((error) => {
        logger.error(error, `Dynamodb updateAuth failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

module.exports = {
  deleteAuth,
  getAuth,
  putAuth,
  updateAuth,
};
