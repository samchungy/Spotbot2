const logger = require(process.env.LOGGER);

const {getSetting, putSetting, settingModel, settingUpdateModel, updateSetting, settingValues} = require('/opt/db/settings');

/**
 * Load state for getting back to playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} settingKey
 * @param {string} keys
 */
async function loadSetting(teamId, channelId, settingKey, keys) {
  try {
    const setting = settingModel(teamId, channelId, settingKey, null, null);
    const item = await getSetting(setting, keys);
    return item.Item ? settingValues(item.Item) : null;
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
 * @param {string} expiry
 */
async function storeSetting(teamId, channelId, settingKey, value, expiry) {
  try {
    const setting = settingModel(teamId, channelId, settingKey, value, expiry);
    return await putSetting(setting);
  } catch (error) {
    logger.error(`Storing ${settingKey} from Dynamodb failed`);
    throw error;
  }
}

/**
 * Change Setting
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} settingKey
 * @param {*} values
 */
async function changeSetting(teamId, channelId, settingKey, values) {
  try {
    const setting = settingUpdateModel(teamId, channelId, settingKey, values);
    return await updateSetting(setting);
  } catch (error) {
    logger.error(`Changing ${settingKey} in Dynamodb failed`);
    throw error;
  }
}

module.exports = {
  changeSetting,
  loadSetting,
  storeSetting,
};
