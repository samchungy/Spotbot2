const logger = require('pino')();
const dynamoDb = require('./db');

const settingInfo = item => {
    return {
        TableName: process.env.SETTINGS_TABLE,
        Item: item
    }
}

const settingModel = (name, value) => {
    return {
        name: name,
        value: value
    };
};

const getSettingInfo = key => {
    return {
        TableName: process.env.SETTINGS_TABLE,
        Key: key
    }
}

const putSetting = setting => {
    return dynamoDb.put(settingInfo(setting)).promise();
};

const getSetting = setting => {
    return dynamoDb.get(getSettingInfo(setting)).promise();
}

module.exports = {
    getSetting,
    putSetting,
    settingModel
}