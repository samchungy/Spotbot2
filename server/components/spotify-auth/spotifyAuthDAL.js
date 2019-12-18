const config = require('config');
const logger = require('pino')();

const { getSetting, putSetting, settingModel } = require('../../db/settings');
const STATE = config.get('dynamodb.settings.state');
const ACCESS = config.get('dynamodb.settings.access');
const REFRESH = config.get('dynamodb.settings.refresh');

async function storeState(state){
    let setting = settingModel(STATE, state);
    return await putSetting(setting);
}

async function getState(){
    try {
        let setting = settingModel(STATE, null);
        let result = await getSetting(setting);
        return result.Item.value;
    } catch (error) {
        logger.error("Get Setting failed");
        throw error;
    }
}

async function getTokens(){
    try {
        let access = settingModel(ACCESS, null);
        let refresh = settingModel(REFRESH, null)
        let result = await Promise.all([await getSetting(access), await getSetting(refresh)]);
        return {access_token: result[0].Item.value, refresh_token: result[1].Item.value }
    } catch (error) {
        logger.error("Get Setting failed");
        throw error;
    }
}


async function storeTokens(access_token, refresh_token){
    let access = settingModel(ACCESS, access_token);
    let refresh = settingModel(REFRESH, refresh_token);
    return await Promise.all([await putSetting(access), await putSetting(refresh)])
}

module.exports = {
    getState,
    getTokens,
    storeState,
    storeTokens
}