const config = require('config');
const logger = require('../../util/util-logger');
const {fetchDevices} = require('../spotify-api/spotify-api-devices');
const {loadDevices, storeDevices} = require('./settings-dal');
const {loadDefaultDevice} = require('./settings-interface');
const {option} = require('../slack/format/slack-format-modal');
const {modelDevice} = require('./settings-model');
const Device = require('../../util/util-spotify-device');

const SETTINGS_HELPER = config.get('dynamodb.settings_helper');

/**
 * Fetch all spotifyDevices from Spotify
 * @param {string} teamId
 * @param {string} channelId
 */
async function allDevices(teamId, channelId) {
  try {
    const [defaultDevice, spotifyDevices] = await Promise.all([loadDefaultDevice(teamId, channelId), fetchDevices(teamId, channelId )]);
    const devices = [
      ...defaultDevice ? [defaultDevice] : [], // If default device, add
      ...spotifyDevices.devices
          .filter((device) => (!defaultDevice || device.id != defaultDevice.id))
          .map((device) => {
            const deviceObj = new Device(device);
            return modelDevice(deviceObj.name, device.id);
          }),
    ];

    return devices;
  } catch (error) {
    logger.error('all devices from Spotify failed');
    throw error;
  }
}

/**
 * Return device devices for the settings panel.
 * @param {string} teamId
 * @param {string} channelId
 */
async function getAllDevices(teamId, channelId) {
  try {
    const spotifyDevices = await allDevices(teamId, channelId);
    await storeDevices(teamId, channelId, spotifyDevices);
    const devices = [
      option(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices), // Add a none option
      ...spotifyDevices
          .filter((device) => device.id != SETTINGS_HELPER.no_devices)
          .map((device) => option(device.name, device.id)),
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
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} newValue
 * @param {string} oldValue
 */
async function getDeviceValue(teamId, channelId, newValue, oldValue) {
  try {
    switch (newValue) {
      case (oldValue ? oldValue.id : null):
        return oldValue;
      case SETTINGS_HELPER.no_devices:
        return modelDevice(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices);
      default:
        const spotifyDevices = await loadDevices(teamId, channelId);
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
  allDevices,
};
