const config = require('config');
const {loadSetting, storeSetting} = require('../settings/settings-dal');

const SKIP = config.get('dynamodb.settings_extra.skip');

const storeSkip = (teamId, channelId, value) => storeSetting(teamId, channelId, SKIP, value);
const loadSkip = (teamId, channelId) => loadSetting(teamId, channelId, SKIP);

module.exports = {
  loadSkip,
  storeSkip,
};
