const config = require('config');
const logger = require('pino')();

const { getSetting, putSetting, settingModel } = require('../../db/settings');
const STATE = config.get('dynamodb.settings.state')

async function storeState(state){
    let setting = settingModel(STATE, state);
    return await putSetting(setting);
}

async function getState(){
    let setting = settingModel(STATE, null);
    delete setting.value;
    return await getSetting(setting);
}

module.exports = {
    getState,
    storeState
}