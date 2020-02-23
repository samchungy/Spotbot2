const config = require(process.env.CONFIG);
const {changeSetting, loadSetting, storeSetting} = require('./settings-dal');

const SETTINGS_EXTRA = config.dynamodb.settings_extra;

// Functions for other modules to use
const changeSkip = (teamId, channelId, values) => changeSetting(teamId, channelId, SETTINGS_EXTRA.skip, values);

const loadBlacklist = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.blacklist);
const loadSkip = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.skip);

const storeBlacklist = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS_EXTRA.blacklist, value);
const storeSkip = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS_EXTRA.skip, value);

module.exports = {
  changeSkip,
  loadBlacklist,
  loadSkip,
  storeBlacklist,
  storeSkip,
};
