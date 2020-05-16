const CONFIG = require(process.env.CONFIG);
const {getSettings, putSettings, updateSettings, querySettings} = require('./settings-dal');

const MAIN_SETTINGS = CONFIG.dynamodb.main_settings;
const DEVICES = CONFIG.dynamodb.settings_extra.spotify_devices;
const PLAYLISTS = CONFIG.dynamodb.settings_extra.spotify_playlists;

const changeSettings = (teamId, channelId, settings) => {
  const expressionNames = {};
  const expressionValues = {};
  const updateExpression = 'set ' + Object.entries(settings)
      .map(([key, value]) => {
        const expName = `#${key[0].toUpperCase() + key.substr(1)}`;
        const expValue = `:${key}`;
        expressionNames[expName] = key;
        expressionValues[expValue] = value;
        return `${expName}=${expValue}`;
      })
      .join();

  return updateSettings(teamId, channelId, MAIN_SETTINGS, expressionNames, expressionValues, updateExpression);
};

const loadDevices = (teamId, channelId) => getSettings(teamId, channelId, DEVICES);
const loadPlaylists = (teamId, channelId) => getSettings(teamId, channelId, PLAYLISTS);
const loadSettings = (teamId, channelId) => getSettings(teamId, channelId, MAIN_SETTINGS);

const storeDevices = (teamId, channelId, value, expiry) => putSettings(teamId, channelId, DEVICES, value, expiry);
const storePlaylists = (teamId, channelId, value, expiry) => putSettings(teamId, channelId, PLAYLISTS, value, expiry);
const storeSettings = (teamId, channelId, value) => putSettings(teamId, channelId, MAIN_SETTINGS, value);

const removeAllSettings = (teamId, channelId, keys) => batchDeleteSettings(teamId, channelId, keys);

const searchAllSettings = (teamId, channelId) => {
  const expressionNames = {'#TeamChannel': `team_channel`};
  const expressionValues = {':teamChannel': `${teamId}-${channelId}`};
  const keyExpression = '#TeamChannel=:teamChannel';
  return querySettings(expressionNames, expressionValues, keyExpression);
};

const modelPlaylist = (playlist) => ({
  name: playlist.name,
  id: playlist.id,
  uri: playlist.uri,
  url: playlist.external_urls.spotify,
});

const modelDevice = (name, id) => ({
  name: name,
  id: id,
});


module.exports = {
  changeSettings,
  searchAllSettings,
  loadDevices,
  loadPlaylists,
  loadSettings,
  modelDevice,
  modelPlaylist,
  removeAllSettings,
  storeDevices,
  storePlaylists,
  storeSettings,
};
