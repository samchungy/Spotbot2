const logger = require('../../util/logger');
const config = require('config');
const { getSpotifyDevices } = require('../spotify-api/devices');
const { deviceModel, storeDevices, getDevices, getDefaultDevice } = require('./settingsDAL');
const { option } = require('../slack/format/modal');
const { isEqual } = require('../../util/objects');

const SETTINGS_HELPER = config.get('dynamodb.settings_helper');

async function storeAllDevices(){
    try {
        let default_device = await getDefaultDevice();
        let devices = await getSpotifyDevices();
        let stores = [];
        if (default_device){
            stores.push(default_device);
        }
        for (let device of devices.body.devices){
            let model = deviceModel(`${device.name} - ${device.type}`, device.id);
            if (!isEqual(model, default_device)){
                stores.push(model);
            }
        }
        await storeDevices(stores);
        return stores;
    } catch (error) {
        logger.error("Storing all Spotify devices failed");
        throw error;
    }
}

async function getAllDevices(){
    try {
        let stored = await storeAllDevices();
        let options = [];
        //Add a none option
        options.push(option(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices));

        for (let device of stored){
            options.push(option(device.name, device.id));
        }
    
        return {
            options: options
        }
    } catch (error) {
        logger.error("Getting all Spotify devices failed");
        throw error;
    }
}

async function deviceValue(value, oldValue){
    try {
        switch(value){
            case oldValue.id:
                return oldValue;
            case SETTINGS_HELPER.no_devices:
                return deviceModel(SETTINGS_HELPER.no_devices_label,SETTINGS_HELPER.no_devices);
            default:
                let devices = await getDevices();
                for (let device of devices){
                    if (device.id == value){
                        return device;
                    }
                }
        }
    } catch (error) {
        logger.error("Getting Device Value failed");
        throw error;
    }
}

module.exports = {
    deviceValue,
    getAllDevices,
    storeAllDevices
}