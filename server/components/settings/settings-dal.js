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
 * Loads the back to playlist setting from the db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadBackToPlaylist(teamId, channelId) {
  try {
    const setting = settingModel(teamId, channelId, SETTINGS.back_to_playlist, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading Back To Playlist from Dynamodb failed');
    throw error;
  }
}


/**
 * Loads the default device from the db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadDefaultDevice(teamId, channelId) {
  try {
    const setting = settingModel(teamId, channelId, SETTINGS.default_device, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading Default Device from Dynamodb failed');
    throw error;
  }
}

/**
 * Loads the stored devices from the db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadDevices(teamId, channelId) {
  try {
    const setting = settingModel(teamId, channelId, SETTINGS_HELPER.spotify_devices, null);
    return (await getSetting(setting)).Item.value;
  } catch (error) {
    logger.error('Loading stored Spotify Devices from Dynamodb failed');
    throw error;
  }
}

/**
 * Load the stored playlists from the db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadPlaylists(teamId, channelId ) {
  try {
    const setting = settingModel(teamId, channelId, SETTINGS_HELPER.spotify_playlists, null);
    return (await getSetting(setting)).Item.value;
  } catch (error) {
    logger.error('Loading stored Spotify Playlists from Dynamodb failed');
    throw error;
  }
}

/**
 * Load the Spotbot Playlist settings from the db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadPlaylistSetting(teamId, channelId ) {
  try {
    const setting = settingModel(teamId, channelId, SETTINGS.playlist, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Getting playlist setting from Dyanomdb failed');
    throw error;
  }
}

/**
 * Load the Spotify profile from the db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadProfile(teamId, channelId ) {
  try {
    const setting = settingModel(teamId, channelId, PROFILE, null);
    return (await getSetting(setting)).Item.value;
  } catch (error) {
    logger.error('Getting Spotify profile from dynamodb failed');
    throw error;
  }
}

/**
 * Loads the repeat setting from the db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadRepeat(teamId, channelId) {
  try {
    const setting = settingModel(teamId, channelId, SETTINGS.disable_repeats_duration, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading Repeat setting from Dynamodb failed');
    throw error;
  }
}

/**
 * Load saved Settings from the db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadSettings(teamId, channelId ) {
  try {
    const settings = {...SETTINGS};
    // Create a default set of values
    Object.keys(settings).forEach((key) => settings[key] = null);
    if (!teamId || !channelId) {
      return settings;
    }

    const settingsList = Object.keys(SETTINGS).map((key) => settingModel(teamId, channelId, SETTINGS[key], null));
    const batchSettings = await batchGetSettings(settingsList);
    // Read values into settings, should be only 1 table
    for (const table in batchSettings.Responses) {
      if ({}.hasOwnProperty.call(batchSettings.Responses, table)) {
        batchSettings.Responses[table].forEach((key) => settings[key.name] = key.value);
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
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadSkipVotes(teamId, channelId ) {
  try {
    const setting = settingModel(teamId, channelId, SKIP_VOTES, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading view from Dynamodb failed');
    throw error;
  }
}

/**
 * Load Skip Votes After Hours from db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadSkipVotesAfterHours(teamId, channelId ) {
  try {
    const setting = settingModel(teamId, channelId, SKIP_VOTES_AH, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading view from Dynamodb failed');
    throw error;
  }
}

/**
 * Load Timezone from db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadTimezone(teamId, channelId ) {
  try {
    const setting = settingModel(teamId, channelId, TIMEZONE, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Loading view from Dynamodb failed');
    throw error;
  }
}

/**
 * Load stored View from db
 * @param {string} teamId
 * @param {string} channelId
 */
async function loadView(teamId, channelId ) {
  try {
    const setting = settingModel(teamId, channelId, VIEW, null);
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
 * @param {string} teamId
 * @param {string} channelId
 * @param {object} newSettings
 */
async function storeSettings(teamId, channelId, newSettings) {
  try {
    const settings = Object.keys(newSettings).map((key) => putRequest(teamId, channelId, key, newSettings[key]));
    await batchPutSettings(settings);
  } catch (error) {
    logger.error('Storing Settings in Dynamodb failed');
    throw error;
  }
}

/**
 * Stores a playlist object in db
 * @param {string} teamId
 * @param {string} channelId
 * @param {modelPlaylist} playlists
 */
async function storePlaylists(teamId, channelId, playlists) {
  try {
    const setting = settingModel(teamId, channelId, SETTINGS_HELPER.spotify_playlists, playlists);
    await putSetting(setting);
  } catch (error) {
    logger.error('Store Spotify Playlists to Dynamodb failed');
    throw error;
  }
}

/**
 * Store a playlist setting in db
 * @param {string} teamId
 * @param {string} channelId
 * @param {modelPlaylist} playlist
 */
async function storePlaylistSetting(teamId, channelId, playlist) {
  try {
    const setting = settingModel(teamId, channelId, SETTINGS.playlist, playlist);
    await putSetting(setting);
  } catch (error) {
    logger.error('Store Playlist setting to Dynamodb failed');
    throw error;
  }
}

/**
 * Store a device setting in db
 * @param {string} teamId
 * @param {string} channelId
 * @param {modelDevice} device
 */
async function storeDeviceSetting(teamId, channelId, device) {
  try {
    const setting = settingModel(teamId, channelId, SETTINGS.default_device, device);
    await putSetting(setting);
  } catch (error) {
    logger.error('Store Default Device to Dynamodb failed');
    throw error;
  }
}

/**
 * Stores a device object in db
 * @param {string} teamId
 * @param {string} channelId
 * @param {modelDevice} devices
 */
async function storeDevices(teamId, channelId, devices) {
  try {
    const setting = settingModel(teamId, channelId, SETTINGS_HELPER.spotify_devices, devices);
    return await putSetting(setting);
  } catch (error) {
    logger.error('Storing devices to Dynamodb failed');
    throw error;
  }
}

/**
 * Stores a model object in db
 * @param {string} teamId
 * @param {string} channelId
 * @param {modelView} view
 */
async function storeView(teamId, channelId, view) {
  try {
    const setting = settingModel(teamId, channelId, VIEW, view);
    return await putSetting(setting);
  } catch (error) {
    logger.error('Storing view to Dynamodb failed');
    throw error;
  }
}

module.exports = {
  loadBackToPlaylist,
  loadDefaultDevice,
  loadDevices,
  loadPlaylistSetting,
  loadPlaylists,
  loadProfile,
  loadRepeat,
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
