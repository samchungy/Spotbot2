const logger = require('pino')();
const dynamoDb = require('./db');

const tableSet = item => {
    return {
        TableName: process.env.SETTINGS_TABLE,
        ...item
    }
}

const settingInfo = item => {
    return tableSet(
        {
            Item: item
        });
}

const settingModel = (name, value) => {
    let setting = {
        name: name
    }
    if (value){
        setting.value = value
    }
    return setting;
};

const getSettingInfo = key => {
    return tableSet({
        Key: key
    });
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