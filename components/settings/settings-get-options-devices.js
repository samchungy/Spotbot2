const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);
const {fetchDevices} = require('/opt/spotify/spotify-api/spotify-api-devices');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {loadSettings, storeDevices} = require('/opt/settings/settings-interface');
const {option} = require('/opt/slack/format/slack-format-modal');
const {modelDevice} = require('/opt/settings/settings-model');
const Device = require('/opt/spotify/spotify-objects/util-spotify-device');

const SETTINGS_HELPER = config.dynamodb.settings_helper;
const DEFAULT_DEVICE = config.dynamodb.settings.default_device;

/**
 * Fetch all spotifyDevices from Spotify
 * @param {string} teamId
 * @param {string} channelId
 */
async function getAllDevices(teamId, channelId) {
  try {
    const auth = await authSession(teamId, channelId);
    const [settings, spotifyDevices] = await Promise.all([loadSettings(teamId, channelId, [DEFAULT_DEVICE]), fetchDevices(teamId, channelId, auth)]);
    const {[DEFAULT_DEVICE]: defaultDevice} = settings ? settings : {};
    const devices = [
      ...defaultDevice ? [defaultDevice] : [], // If default device, add to list
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
 * @param {Object} event
 * @param {Object} context
 */
module.exports.handler = async (event, context) => {
  try {
    // LAMBDA FUNCTION
    const {teamId, channelId} = event;

    const spotifyDevices = await getAllDevices(teamId, channelId);
    const [, devices] = await Promise.all([
      storeDevices(teamId, channelId, {value: spotifyDevices}, moment().add(1, 'hour').unix()),
      // Convert Devices to Options
      (() => [
        option(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices), // Add a none option
        ...spotifyDevices
            .filter((device) => device.id != SETTINGS_HELPER.no_devices)
            .map((device) => option(device.name, device.id)),
      ])(),
    ]);

    return {
      options: devices,
    };
  } catch (error) {
    logger.error('Getting all Spotify spotifyDevices failed');
    throw error;
  }
};
