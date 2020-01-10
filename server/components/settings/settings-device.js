const config = require('config');
const logger = require('../../util/util-logger');
const {fetchDevices} = require('../spotify-api/spotify-api-devices');
const {loadDevices, loadDefaultDevice, storeDevices} = require('./settings-dal');
const {option} = require('../slack/format/slack-format-modal');
const {isEqual} = require('../../util/util-objects');
const {modelDevice} = require('./settings-model');

const SETTINGS_HELPER = config.get('dynamodb.settings_helper');

/**
 * Fetch all spotifyDevices from Spotify
 */
async function fetchAllDevices() {
  try {
    const devices = [];
    const [defaultDevice, spotifyDevices] = await Promise.all([loadDefaultDevice(), fetchDevices()]);
    if (defaultDevice) {
      devices.push(defaultDevice);
    }
    for (const device of spotifyDevices.devices) {
      const model = modelDevice(`${device.name} - ${device.type}`, device.id);
      // Make sure we do not insert the same device twice.
      if (!isEqual(model, defaultDevice)) {
        devices.push(model);
      }
    }
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
    const devices = [];
    // Add a none option
    devices.push(option(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices));

    for (const device of spotifyDevices) {
      devices.push(option(device.name, device.id));
    }

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
        for (const device of spotifyDevices) {
          if (device.id == newValue) {
            return device;
          }
        }
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
