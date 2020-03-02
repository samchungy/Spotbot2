const config = require(process.env.CONFIG);
const {changeSetting, loadSetting, batchDeleteSettings, querySettings, storeSetting} = require('./settings-dal');

const SETTINGS_EXTRA = config.dynamodb.settings_extra;
const ALL_SETTINGS = config.dynamodb.all_settings;

// Functions for other modules to use
const changeSettings = (teamId, channelId, values) => changeSetting(teamId, channelId, ALL_SETTINGS, values);

const loadDevices = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.spotify_devices);
const loadPlaylists = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.spotify_playlists);
const loadSettings = (teamId, channelId, keys) => loadSetting(teamId, channelId, ALL_SETTINGS, keys);

const storeDevices = (teamId, channelId, value, expiry) => storeSetting(teamId, channelId, SETTINGS_EXTRA.spotify_devices, value, expiry);
const storePlaylists = (teamId, channelId, value, expiry) => storeSetting(teamId, channelId, SETTINGS_EXTRA.spotify_playlists, value, expiry);
const storeSettings = (teamId, channelId, value) => storeSetting(teamId, channelId, ALL_SETTINGS, value);

const deleteSettings = (teamId, channelId, sortKeys) => batchDeleteSettings(teamId, channelId, sortKeys);

const searchAllSettings = (allSettingsKeyExpression, allSettingsExpressionValues) => querySettings(allSettingsKeyExpression, allSettingsExpressionValues);

module.exports = {
  changeSettings,
  deleteSettings,
  searchAllSettings,
  loadDevices,
  loadPlaylists,
  loadSettings,
  storeDevices,
  storePlaylists,
  storeSettings,
};
