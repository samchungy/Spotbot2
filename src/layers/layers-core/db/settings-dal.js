const dynamoDb = require('./db');
const {isEmpty} = require('/opt/utils/util-objects');
const {sleep} = require('/opt/utils/util-timeout');
const logger = require('/opt/utils/util-logger');
const SETTINGS_TABLE = process.env.SETTINGS_TABLE;
const MAX_ATTEMPTS = 3;

const settingsTable = (item) => ({
  TableName: SETTINGS_TABLE,
  ...item,
});

const settingsKey = (teamId, channelId, key) => ({
  team_channel: `${teamId}-${channelId}`,
  name: key,
});

// eslint-disable-next-line no-unused-vars, camelcase
const settingsValue = ({team_channel, name, ...valuesToKeep}) => valuesToKeep;

const getSettings = (teamId, channelId, key) => {
  const item = settingsTable({
    Key: settingsKey(teamId, channelId, key),
  });
  return dynamoDb.get(item).promise()
      .then((data) => data && data.Item ? settingsValue(data.Item) : null)
      .catch((error) => {
        logger.error(error, `Dynamodb getSettings failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

const putSettings = (teamId, channelId, key, values, expiry) => {
  const item = settingsTable({
    Item: {
      ...settingsKey(teamId, channelId, key),
      ...values,
      ...expiry ? {ttl: expiry} : {},
    },
  });
  return dynamoDb.put(item).promise()
      .then((data) => data ? Promise.resolve(data) : Promise.reject(data))
      .catch((error) => {
        logger.error(error, `Dynamodb putSettings failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

const querySettings = (expressionAttributeNames, expressionAttributeValues, keyConditionExpression) => {
  const item = settingsTable({
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    KeyConditionExpression: keyConditionExpression,
  });
  return dynamoDb.query(item).promise()
      .then((data) => data ? data.Items : Promise.reject(data))
      .catch((error) => {
        logger.error(error, `Dynamodb querySettings failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

const updateSettings = (teamId, channelId, key, expressionAttributeNames, expressionAttributeValues, updateExpression, conditionExpression, returnValues='NONE') => {
  const item = settingsTable({
    Key: settingsKey(teamId, channelId, key),
    ExpressionAttributeNames: expressionAttributeNames,
    ...expressionAttributeValues ? {ExpressionAttributeValues: expressionAttributeValues} : {},
    UpdateExpression: updateExpression,
    ReturnValues: returnValues,
    ...conditionExpression ? {ConditionExpression: conditionExpression} : {},
  });
  return dynamoDb.update(item).promise()
      .catch((error) => {
        logger.error(error, `Dynamodb updateSettings failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};


const deleteSettings = (teamId, channelId, key) => {
  const item = settingsTable({
    Key: settingsKey(teamId, channelId, key),
  });
  return dynamoDb.delete(item).promise()
      .catch((error) => {
        logger.error(error, `Dynamodb deleteSettings failed with key ${JSON.stringify(item)}`);
        throw error;
      });
};

const batchDeleteSettings = async (teamId, channelId, keys) => {
  const item = {
    [SETTINGS_TABLE]: keys.map((key) => ({
      DeleteRequest: {
        Key: settingsKey(teamId, channelId, key),
      },
    })),
  };

  // Delete with retries and exponential backoff enabled
  const batchDelete = (item, attempt=0) => {
    return dynamoDb.batchWrite(item).promise()
        .then(async (data) => {
          if (!data) {
            Promise.reject(data);
          } else if (attempt > MAX_ATTEMPTS) {
            Promise.reject(new Error(`Maximum retries ${MAX_ATTEMPTS} exceeded`));
          }
          if (!isEmpty(data.UnprocessedItems)) {
            await sleep(attempt*1000); // Backoff time
            return batchDelete(data.UnprocessedItems, attempt+1);
          }
          return null;
        }).catch((error) => {
          logger.error(error, `Dynamodb batchDeleteSettings failed with key ${JSON.stringify(item)}`);
          throw error;
        });
  };
  return batchDelete(item);
};


module.exports = {
  batchDeleteSettings,
  deleteSettings,
  getSettings,
  updateSettings,
  putSettings,
  querySettings,
};
