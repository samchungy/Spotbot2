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

const settingModel = (name, value) => {
  return {
    name: name,
    ...value ? {value: value} : {},
  };
};

const putRequest = (name, value) => {
  return {
    PutRequest: {
      Item: settingModel(name, value),
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
