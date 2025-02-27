const CONFIG = require('/opt/config/config');
const {batchDeleteSettings, getSettings, putSettings, updateSettings, querySettings} = require('./settings-dal');

const MAIN_SETTINGS = CONFIG.dynamodb.main_settings;

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

const loadSettings = (teamId, channelId) => getSettings(teamId, channelId, MAIN_SETTINGS);

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
  loadSettings,
  modelDevice,
  modelPlaylist,
  removeAllSettings,
  storeSettings,
};
