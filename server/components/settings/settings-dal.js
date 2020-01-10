const config = require('config');
const logger = require('../../util/util-logger');
const {batchGetSettings, batchPutSettings, getSetting, putSetting, putRequest, settingModel} = require('../../db/settings');

const SETTINGS = config.get('dynamodb.settings');
const PROFILE = config.get('dynamodb.auth.spotify_id');
const VIEW = config.get('dynamodb.auth.view_id');
const SETTINGS_HELPER = config.get('dynamodb.settings_helper');
const SKIP_VOTES = config.get('dynamodb.settings.skip_votes');
const SKIP_VOTES_AH = config.get('dynamodb.settings.skip_votes_ah');
const TIMEZONE = config.get('dynamodb.settings.timezone');

// Load Functions

/**
 * Loads the default device from the db
 */
async function loadDefaultDevice() {
  try {
    const setting = settingModel(SETTINGS.default_device, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading Default Device from Dynamodb failed');
    throw error;
  }
}

/**
 * Loads the stored devices from the db
 */
async function loadDevices() {
  try {
    const setting = settingModel(SETTINGS_HELPER.spotify_devices, null);
    return (await getSetting(setting)).Item.value;
  } catch (error) {
    logger.error('Loading stored Spotify Devices from Dynamodb failed');
    throw error;
  }
}

/**
 * Load the stored playlists from the db
 */
async function loadPlaylists() {
  try {
    const setting = settingModel(SETTINGS_HELPER.spotify_playlists, null);
    return (await getSetting(setting)).Item.value;
  } catch (error) {
    logger.error('Loading stored Spotify Playlists from Dynamodb failed');
    throw error;
  }
}

/**
 * Load the Spotbot Playlist settings from the db
 */
async function loadPlaylistSetting() {
  try {
    const setting = settingModel(SETTINGS.playlist, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Getting playlist setting from Dyanomdb failed');
    throw error;
  }
}

/**
 * Load the Spotify profile from the db
 */
async function loadProfile() {
  try {
    const setting = settingModel(PROFILE, null);
    return (await getSetting(setting)).Item.value;
  } catch (error) {
    logger.error('Getting Spotify profile from dynamodb failed');
    throw error;
  }
}

/**
 * Load saved Settings from the db
 */
async function loadSettings() {
  try {
    const settings = {...SETTINGS};
    // Create a default set of values
    for (const key in settings) {
      if ({}.hasOwnProperty.call(settings, key)) {
        settings[key] = null;
      }
    }
    const settingsList = [];

    // Initialise Search Keys
    for (const key in SETTINGS) {
      if ({}.hasOwnProperty.call(SETTINGS, key)) {
        settingsList.push(settingModel(SETTINGS[key], null));
      }
    }
    const batchSettings = await batchGetSettings(settingsList);
    // Read values into settings, should be only 1 table
    for (const table in batchSettings.Responses) {
      if ({}.hasOwnProperty.call(batchSettings.Responses, table)) {
        for (const key of batchSettings.Responses[table]) {
          settings[key.name] = key.value;
        }
      }
    }

    return settings;
  } catch (error) {
    logger.error('Load Settings from Dynamodb failed');
    throw error;
  }
}

/**
 * Load Skip Votes from db
 */
async function loadSkipVotes() {
  try {
    const setting = settingModel(SKIP_VOTES, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading view from Dynamodb failed');
    throw error;
  }
}

/**
 * Load Skip Votes After Hours from db
 */
async function loadSkipVotesAfterHours() {
  try {
    const setting = settingModel(SKIP_VOTES_AH, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading view from Dynamodb failed');
    throw error;
  }
}

/**
 * Load Timezone from db
 */
async function loadTimezone() {
  try {
    const setting = settingModel(TIMEZONE, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading view from Dynamodb failed');
    throw error;
  }
}

/**
 * Load stored View from db
 */
async function loadView() {
  try {
    const setting = settingModel(VIEW, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading view from Dynamodb failed');
    throw error;
  }
}

// Store Functions

/**
 * Stores the settings object in db
 * @param {object} newSettings
 */
async function storeSettings(newSettings) {
  try {
    const settings = [];
    for (const key in newSettings) {
      if ({}.hasOwnProperty.call(newSettings, key)) {
        settings.push(putRequest(key, newSettings[key]));
      }
    }
    await batchPutSettings(settings);
  } catch (error) {
    logger.error('Storing Settings in Dynamodb failed');
    throw error;
  }
}

/**
 * Stores a playlist object in db
 * @param {modelPlaylist} playlists
 */
async function storePlaylists(playlists) {
  try {
    const setting = settingModel(SETTINGS_HELPER.spotify_playlists, playlists);
    await putSetting(setting);
  } catch (error) {
    logger.error('Store Spotify Playlists to Dynamodb failed');
    throw error;
  }
}

/**
 * Store a playlist setting in db
 * @param {modelPlaylist} playlist
 */
async function storePlaylistSetting(playlist) {
  try {
    const setting = settingModel(SETTINGS.playlist, playlist);
    await putSetting(setting);
  } catch (error) {
    logger.error('Store Playlist setting to Dynamodb failed');
    throw error;
  }
}

/**
 * Store a device setting in db
 * @param {modelDevice} device
 */
async function storeDeviceSetting(device) {
  try {
    const setting = settingModel(SETTINGS.default_device, device);
    await putSetting(setting);
  } catch (error) {
    logger.error('Store Default Device to Dynamodb failed');
    throw error;
  }
}

/**
 * Stores a device object in db
 * @param {modelDevice} devices
 */
async function storeDevices(devices) {
  try {
    const setting = settingModel(SETTINGS_HELPER.spotify_devices, devices);
    return await putSetting(setting);
  } catch (error) {
    logger.error('Storing devices to Dynamodb failed');
    throw error;
  }
}

/**
 * Stores a model object in db
 * @param {modelView} view
 */
async function storeView(view) {
  try {
    const setting = settingModel(VIEW, view);
    return await putSetting(setting);
  } catch (error) {
    logger.error('Storing view to Dynamodb failed');
    throw error;
  }
}

module.exports = {
  loadDefaultDevice,
  loadDevices,
  loadPlaylistSetting,
  loadPlaylists,
  loadProfile,
  loadSettings,
  loadSkipVotes,
  loadSkipVotesAfterHours,
  loadTimezone,
  loadView,
  storeDevices,
  storeDeviceSetting,
  storePlaylists,
  storePlaylistSetting,
  storeSettings,
  storeView,
};
