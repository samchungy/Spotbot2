const config = require(process.env.CONFIG);
const {changeSetting, loadSetting, storeSetting} = require('./settings-dal');

const SETTINGS_EXTRA = config.dynamodb.settings_extra;
const ALL_SETTINGS = config.dynamodb.all_settings;

// Functions for other modules to use
const changeSettings = (teamId, channelId, values) => changeSetting(teamId, channelId, ALL_SETTINGS, values);

const loadBackToPlaylistState = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.back_to_playlist_state);
const loadDevices = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.spotify_devices);
const loadPlaylists = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.spotify_playlists);
const loadSettings = (teamId, channelId) => loadSetting(teamId, channelId, ALL_SETTINGS);

const storeBackToPlaylistState = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS_EXTRA.back_to_playlist_state, value);
const storeDevices = (teamId, channelId, value, expiry) => storeSetting(teamId, channelId, SETTINGS_EXTRA.spotify_devices, value, expiry);
const storePlaylists = (teamId, channelId, value, expiry) => storeSetting(teamId, channelId, SETTINGS_EXTRA.spotify_playlists, value, expiry);
const storeSettings = (teamId, channelId, value) => storeSetting(teamId, channelId, ALL_SETTINGS, value);

module.exports = {
  changeSettings,
  loadBackToPlaylistState,
  loadDevices,
  loadPlaylists,
  loadSettings,
  storeBackToPlaylistState,
  storeDevices,
  storePlaylists,
  storeSettings,
};
