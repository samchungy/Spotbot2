const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {batchGetSettings, batchPutSettings, getSetting, putSetting, putRequest, settingModel} = require('/opt/db/settings');

const SETTINGS = config.dynamodb.settings;
const SETTINGS_EXTRA = config.dynamodb.settings_extra;

// Settings Modal Helper Functions

const loadDevices = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.spotify_devices);
const loadPlaylists = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.spotify_playlists);
const storeDevices = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS_EXTRA.spotify_devices, value);
const storePlaylists = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS_EXTRA.spotify_playlists, value);

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
 * Load state for getting back to playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} settingKey
 */
async function loadSetting(teamId, channelId, settingKey) {
  try {
    const setting = settingModel(teamId, channelId, settingKey, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error(`Loading ${settingKey} from Dynamodb failed`);
    throw error;
  }
}

/**
 * Store Settings
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} settingKey
 * @param {*} value
 */
async function storeSetting(teamId, channelId, settingKey, value) {
  try {
    const setting = settingModel(teamId, channelId, settingKey, value);
    return await putSetting(setting);
  } catch (error) {
    logger.error(`Storing ${settingKey} from Dynamodb failed`);
    throw error;
  }
}

module.exports = {
  loadDevices,
  loadPlaylists,
  loadSetting,
  loadSettings,
  storeDevices,
  storePlaylists,
  storeSetting,
  storeSettings,
};
