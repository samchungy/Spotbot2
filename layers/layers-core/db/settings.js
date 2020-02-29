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
    ...value ? value : {},
    ...expiry ? {ttl: expiry} : {},
  };
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

const updateSetting = (setting) => {
  return dynamoDb.update(setting).promise();
};

module.exports = {
  batchGetSettings,
  batchPutSettings,
  getSetting,
  putSetting,
  putRequest,
  settingModel,
  settingUpdateModel,
  settingValues,
  updateSetting,
};
