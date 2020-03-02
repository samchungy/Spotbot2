const dynamoDb = require('./db');
const SETTINGS_TABLE = process.env.SETTINGS_TABLE;

const settingTable = (item) => {
  return {
    TableName: SETTINGS_TABLE,
    ...item,
  };
};

const settingInfo = (item) => {
  return settingTable(
      {
        Item: item,
      });
};

const settingModel = (team, channel, name, value, expiry) => {
  return {
    name: name,
    team_channel: `${team}-${channel}`,
    team: team,
    ...value ? value : {},
    ...expiry ? {ttl: expiry} : {},
  };
};

const settingQueryModel = (key, values) => {
  return settingTable({
    KeyConditionExpression: key,
    ExpressionAttributeValues: values,
  });
};

const settingUpdateModel = (team, channel, name, values) => {
  expressionValues = {};
  updateExpressions = values.map(({key, value}) => {
    expressionValues[`:${key}`] = value;
    return `${key} = :${key}`;
  });
  return settingTable({
    Key: {
      name: name,
      team_channel: `${team}-${channel}`,
    },
    UpdateExpression: `set ${updateExpressions.join(', ')}`,
    ExpressionAttributeValues: expressionValues,
  });
};

const settingBatchRemoveModel = (team, channel, sortKeys) => {
  const keys = [];
  sortKeys.forEach((sort) => {
    keys.push({
      DeleteRequest: {
        Key: {
          team_channel: `${team}-${channel}`,
          name: sort,
        },
      },
    });
  });
  return keys;
};

const settingValues = (item) => {
  // eslint-disable-next-line no-unused-vars, camelcase
  const {name, team_channel, ...results} = item;
  return results;
};

const putRequest = (team, channel, name, value) => {
  return {
    PutRequest: {
      Item: settingModel(team, channel, name, value),
    },
  };
};

const getSettingInfo = (key, keys) => {
  return settingTable({
    Key: key,
    ...keys ? {ProjectionExpression: keys.join(', ')}: {},
  });
};

const batchDeleteInfo = (settings) => {
  return {
    RequestItems: {
      [SETTINGS_TABLE]: settings,
    },
  };
};

const batchGetInfo = (settings) => {
  return {
    RequestItems: {
      [SETTINGS_TABLE]: {
        Keys: settings,
      },
    },
  };
};

const batchPutInfo = (settings) => {
  return {
    RequestItems: {
      [SETTINGS_TABLE]: settings,
    },
  };
};

const putSetting = (setting) => {
  return dynamoDb.put(settingInfo(setting)).promise();
};

const getSetting = (setting, keys) => {
  return dynamoDb.get(getSettingInfo(setting, keys)).promise();
};

const batchGetSettings = (settings) => {
  return dynamoDb.batchGet(batchGetInfo(settings)).promise();
};

const batchPutSettings = (settings) => {
  return dynamoDb.batchWrite(batchPutInfo(settings)).promise();
};

const batchRemoveSettings = (settings) => {
  return dynamoDb.batchWrite(batchDeleteInfo(settings)).promise();
};

const querySetting = (setting) => {
  return dynamoDb.query(setting).promise();
};


const updateSetting = (setting) => {
  return dynamoDb.update(setting).promise();
};

const removeSetting = (setting) => {
  return dynamoDb.delete(setting).promise();
};

module.exports = {
  batchRemoveSettings,
  batchGetSettings,
  batchPutSettings,
  getSetting,
  querySetting,
  putSetting,
  putRequest,
  removeSetting,
  settingQueryModel,
  settingModel,
  settingBatchRemoveModel,
  settingUpdateModel,
  settingValues,
  updateSetting,
};
