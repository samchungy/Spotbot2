const logger = require('../../util/logger');
const config = require('config');
const { getSpotifyDevices } = require('../spotify-api/devices');
const { deviceModel, storeDevices, getDevices } = require('./settingsDAL');
const { option } = require('../slack/format/dialog');
const { isEqual } = require('../../util/objects');

const SETTINGS_HELPER = config.get('dynamodb.settings_helper');

async function storeAllDevices(old_device){
    try {
        let devices = await getSpotifyDevices();
        let stores = [];
        if (old_device){
            stores.push(old_device);
        }
        for (let device of devices.body.devices){
            let model = deviceModel(device.name, device.id);
            if (!isEqual(model, old_device)){
                stores.push(model);
            }
        }
        await storeDevices(stores);
    } catch (error) {
        logger.error("Storing all Spotify devices failed");
        throw error;
    }
}

async function getAllDevices(){
    try {
        let options = [];
        //Add a none option
        options.push(option(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices));
    
        let devices = await getDevices();
        for (let device of devices){
            options.push(option(device.name, device.id));
        }
    
        return options
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