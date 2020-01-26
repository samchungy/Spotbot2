const dynamoDb = require('./db');
const SETTINGS_TABLE = process.env.SETTINGS_TABLE;

const tableSet = (item) => {
  return {
    TableName: SETTINGS_TABLE,
    ...item,
  };
};

const settingInfo = (item) => {
  return tableSet(
      {
        Item: item,
      });
};

const settingModel = (team, channel, name, value) => {
  return {
    name: name,
    team_channel: team+channel,
    ...value ? {value: value} : {},
  };
};

const putRequest = (team, channel, name, value) => {
  return {
    PutRequest: {
      Item: settingModel(team, channel, name, value),
    },
  };
};

const getSettingInfo = (key) => {
  return tableSet({
    Key: key,
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

const getSetting = (setting) => {
  return dynamoDb.get(getSettingInfo(setting)).promise();
};

const batchGetSettings = (settings) => {
  return dynamoDb.batchGet(batchGetInfo(settings)).promise();
};

const batchPutSettings = (settings) => {
  return dynamoDb.batchWrite(batchPutInfo(settings)).promise();
};

module.exports = {
  batchGetSettings,
  batchPutSettings,
  getSetting,
  putSetting,
  putRequest,
  settingModel,
};
