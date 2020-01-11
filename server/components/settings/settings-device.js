const config = require('config');
const logger = require('../../util/util-logger');
const {fetchDevices} = require('../spotify-api/spotify-api-devices');
const {loadDevices, loadDefaultDevice, storeDevices} = require('./settings-dal');
const {option} = require('../slack/format/slack-format-modal');
const {modelDevice} = require('./settings-model');

const SETTINGS_HELPER = config.get('dynamodb.settings_helper');

/**
 * Fetch all spotifyDevices from Spotify
 */
async function fetchAllDevices() {
  try {
    const [defaultDevice, spotifyDevices] = await Promise.all([loadDefaultDevice(), fetchDevices()]);
    const devices = [
      ...defaultDevice ? [defaultDevice] : [], // If default device, add
      ...spotifyDevices.devices
          .filter((device) => device.id != defaultDevice.id)
          .map((device) => modelDevice(`${device.name} - ${device.type}`, device.id)),
    ];

    return devices;
  } catch (error) {
    logger.error('Fetching all Spotify spotifyDevices failed');
    throw error;
  }
}

/**
 * Return device devices for the settings panel.
 */
async function getAllDevices() {
  try {
    const spotifyDevices = await fetchAllDevices();
    await storeDevices(spotifyDevices);
    // Add a none option
    const devices = [
      option(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices),
      ...spotifyDevices.map((device) => option(device.name, device.id)),
    ];

    return {
      options: devices,
    };
  } catch (error) {
    logger.error('Getting all Spotify spotifyDevices failed');
    throw error;
  }
}

/**
 * Get the device value from devices fetch
 * @param {string} newValue
 * @param {string} oldValue
 */
async function getDeviceValue(newValue, oldValue) {
  try {
    switch (newValue) {
      case (oldValue ? oldValue.id : null):
        return oldValue;
      case SETTINGS_HELPER.no_devices:
        return modelDevice(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices);
      default:
        const spotifyDevices = await loadDevices();
        return spotifyDevices.find((device) => device.id === newValue);
    }
  } catch (error) {
    logger.error('Getting Device Value failed');
    throw error;
  }
}

module.exports = {
  getDeviceValue,
  getAllDevices,
  fetchAllDevices,
};
