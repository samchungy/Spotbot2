const config = require(process.env.CONFIG);
const {loadSetting, storeSetting} = require('./settings-dal');
const SETTINGS_EXTRA = config.dynamodb.settings_extra;

// Settings Modal Helper Functions

const loadDevices = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.spotify_devices);
const loadPlaylists = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.spotify_playlists);
const storeDevices = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS_EXTRA.spotify_devices, value);
const storePlaylists = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS_EXTRA.spotify_playlists, value);

module.exports = {
  loadDevices,
  loadPlaylists,
  storeDevices,
  storePlaylists,
};
