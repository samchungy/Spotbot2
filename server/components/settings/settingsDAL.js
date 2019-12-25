const config = require('config');
const logger = require('pino')();
const { nullOrValue } = require('../../util/objects');

const { batchGetSettings, batchPutSettings, putRequest, settingModel } = require('../../db/settings');
const SETTINGS = config.get('dynamodb.settings');

async function getSettings(){
    try {
        let settings = {...SETTINGS};
        //Create a default set of values
        for (let attribute in settings){
            settings[attribute] = null;
        }
        let settings_list = [];
    
        //Initialise Search Keys
        for(let attribute in SETTINGS){
            settings_list.push(settingModel(SETTINGS[attribute], null));
        }
    
        let batchSettings = await batchGetSettings(settings_list);
        // Read values into settings, should be only 1 table
        for (let table in batchSettings.Responses){
            for (let attribute of batchSettings.Responses[table]){
                settings[attribute.name] = attribute.value
            }
        }
    
        return settings;
    } catch (error) {
        logger.error("Get Settings failed");
        throw error;
    }
}

async function updateSettings(new_settings){

    try {
        let settings = []
        for (let attribute in new_settings){
            settings.push(putRequest(attribute, new_settings[attribute]));
        }
        await batchPutSettings(settings);
    } catch (error) {
        logger.error("Update Settings failed");
        throw error;
    }
}

module.exports = {
    getSettings,
    updateSettings
}