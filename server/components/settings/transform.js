const config = require('config');
const {getPlaylistValue} = require('./playlists');
const {getDeviceValue} = require('./devices');
const SETTINGS = config.get('dynamodb.settings');

/**
 * Transform our value from the Submission into a setting to store
 * @param {string} attribute
 * @param {string} newValue
 * @param {string} oldValue
 */
async function transformValue(attribute, newValue, oldValue) {
  switch (attribute) {
    case SETTINGS.playlist:
      newValue = await getPlaylistValue(newValue);
      break;
    case SETTINGS.default_device:
      newValue = await getDeviceValue(newValue, oldValue);
      break;
  }
  return newValue;
}

module.exports = {
  transformValue,
};
