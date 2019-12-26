const config = require('config');
const logger = require('pino')();
const { nullOrValue } = require('../../util/objects');

const { getSetting, putSetting, settingModel } = require('../../db/settings');
const AUTH = config.get('dynamodb.auth');

async function storeState(state){
    let setting = settingModel(AUTH.state, state);
    return await putSetting(setting);
}

async function getState(){
    try {
        let setting = settingModel(AUTH.state, null);
        let result = await getSetting(setting);
        return result.Item.value;
    } catch (error) {
        logger.error("Get Setting failed");
        throw error;
    }
}

async function getTokens(){
    try {
        let access, refresh = null;
        let authentication = settingModel(AUTH.object, null);
        let result = await getSetting(authentication);
        if(nullOrValue(result)){
            access = result.Item.value[AUTH.access];
            refresh = result.Item.value[AUTH.refresh];
        }
        return { 
            access_token: access,
            refresh_token: refresh 
        }
    } catch (error) {
        logger.error("Get Tokens failed");
        throw error;
    }
}


async function storeTokens(access_token, refresh_token){
    let authentication = settingModel(AUTH.object, {
        [AUTH.access]: access_token,
        [AUTH.refresh]: refresh_token,
        [AUTH.expires]: new Date()
    })
    return await putSetting(authentication);
}

async function storeProfile(id){
    let setting = settingModel(AUTH.spotify_id, id);
    return await putSetting(setting);
}

module.exports = {
    getState,
    getTokens,
    storeProfile,
    storeState,
    storeTokens
}