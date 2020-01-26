const config = require('config');
const {getSetting, putSetting, settingModel} = require('../../db/settings');

const SKIP = config.get('dynamodb.skip');

/**
 * Stores our skip request/vote to the DB
 * @param {string} team
 * @param {string} channel
 * @param {object} skip
 */
async function storeSkip(team, channel, skip) {
  try {
    const setting = settingModel(team, channel, SKIP, skip);
    await putSetting(setting);
  } catch (error) {
    logger.error('Storing Skip to Dyanmodb failed.');
    throw error;
  }
}

/**
 * Loads our skip request/vote from the DB
 * @param {string} team
 * @param {string} channel
 */
async function loadSkip(team, channel) {
  try {
    const setting = settingModel(team, channel, SKIP, null);
    const item = await getSetting(setting);
    return item.Item ? item.Item.value : null;
  } catch (error) {
    logger.error('Storing Skip to Dyanmodb failed.');
    throw error;
  }
}

module.exports = {
  loadSkip,
  storeSkip,
};
