const config = require('config');
const {getPlaylistValue} = require('./settings-playlists');
const {getDeviceValue} = require('./settings-device');
const SETTINGS = config.get('dynamodb.settings');

/**
 * Transform our value from the Submission into a setting to store
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} attribute
 * @param {string} newValue
 * @param {string} oldValue
 */
async function transformValue(teamId, channelId, attribute, newValue, oldValue) {
  switch (attribute) {
    case SETTINGS.playlist:
      newValue = await getPlaylistValue(teamId, channelId, newValue);
      break;
    case SETTINGS.default_device:
      newValue = await getDeviceValue(teamId, channelId, newValue, oldValue);
      break;
  }
  return newValue;
}

module.exports = {
  transformValue,
};
