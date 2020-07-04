const dynamoDb = require('./db');
const SEARCH_TABLE = process.env.SEARCH_TABLE;
const logger = require(process.env.LOGGER);

const searchTable = (item) => ({
  TableName: SEARCH_TABLE,
  ...item,
});

const searchKey = (teamId, channelId, key) => ({
  team_channel: `${teamId}-${channelId}`,
  triggerId: key,
});

// eslint-disable-next-line no-unused-vars, camelcase
const searchValue = ({team_channel, triggerId, ...valuesToKeep}) => valuesToKeep;

const getSearch = (teamId, channelId, key) => {
  const item = searchTable({
    Key: searchKey(teamId, channelId, key),
  });
  return dynamoDb.get(item).promise()
      .then((data) => data && data.Item ? searchValue(data.Item) : null)
      .catch((error) => {
        logger.error(error, `Dynamodb getSearch failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

const putSearch = (teamId, channelId, key, values, expiry) => {
  const item = searchTable({
    Item: {
      ...searchKey(teamId, channelId, key),
      ...values,
      ...expiry ? {ttl: expiry} : {},
    },
  });
  return dynamoDb.put(item).promise()
      .then((data) => data ? Promise.resolve(data) : Promise.reject(data))
      .catch((error) => {
        logger.error(error, `Dynamodb putSearch failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

const updateSearch = (teamId, channelId, key, expressionAttributeNames, expressionAttributeValues, updateExpression, conditionExpression) => {
  const item = searchTable({
    Key: searchKey(teamId, channelId, key),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    UpdateExpression: updateExpression,
    ...conditionExpression ? {ConditionExpression: conditionExpression} : {},
  });
  return dynamoDb.update(item).promise()
      .catch((error) => {
        logger.error(error, `Dynamodb updateSearch failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

module.exports = {
  getSearch,
  putSearch,
  updateSearch,
};
