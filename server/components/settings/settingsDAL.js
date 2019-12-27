const config = require('config');
const logger = require('../../util/logger');
const { nullOrValue } = require('../../util/objects');

const { batchGetSettings, batchPutSettings, putRequest, settingModel, getSetting, putSetting } = require('../../db/settings');
const SETTINGS = config.get('dynamodb.settings');
const PROFILE = config.get('dynamodb.auth.spotify_id');
const SETTINGS_HELPER = config.get('dynamodb.settings_helper');

async function getProfile(){
    let setting = settingModel(PROFILE, null);
    return (await getSetting(setting)).Item.value;
}

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

async function storePlaylists(playlists){
    try {
        let setting = settingModel(SETTINGS_HELPER.spotify_playlists, playlists);
        await putSetting(setting);
    } catch (error) {
        logger.error("Store Spotify Playlists to Dynamodb failed");
        throw error;
    }
}

async function getPlaylistSetting(){
    try {
        let setting = settingModel(SETTINGS.playlist, null);
        return (await getSetting(setting)).Item.value;
    } catch (error) {
        logger.error("Getting playlist setting from Dyanomdb failed");
        throw error;
    }
}

async function getPlaylists(){
    try {
        let setting = settingModel(SETTINGS_HELPER.spotify_playlists, null);
        return (await getSetting(setting)).Item.value;
    } catch (error) {
        logger.error("Getting Spotify Playlist from Dynamodb failed");
        throw error;
    }
}

async function storeDevices(devices){
    try {
        let setting = settingModel(SETTINGS_HELPER.spotify_devices, devices);
        return await putSetting(setting);
    } catch (error) {
        logger.error("Storing devices to Dynamodb failed");
        throw error;
    }
}

async function getDefaultDevice(){
    let setting = settingModel(SETTINGS.default_device, null);
    return (await getSetting(setting)).Item.value;
}

async function getDevices(){
    try {
        let setting = settingModel(SETTINGS_HELPER.spotify_devices, null);
        return (await getSetting(setting)).Item.value;
    } catch (error) {
        logger.error("Getting Spotify Devices from Dynamodb failed");
    }
}

const playlistModel = (name, id, url) => {
    return {
        name: name,
        id: id,
        url: url
    }
}

const deviceModel = (name, id) => {
    return {
        name: name,
        id: id
    }
}

module.exports = {
    deviceModel,
    getDefaultDevice,
    getDevices,
    getPlaylistSetting,
    getPlaylists,
    getProfile,
    getSettings,
    playlistModel,
    storeDevices,
    storePlaylists,
    updateSettings
}