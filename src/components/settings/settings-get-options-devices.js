const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const {fetchDevices} = require('/opt/spotify/spotify-api-v2/spotify-api-devices');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const Device = require('/opt/spotify/spotify-objects/util-spotify-device');

// Settings
const {modelDevice} = require('/opt/db/settings-interface');

// Slack
const {option} = require('/opt/slack/format/slack-format-modal');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const SETTINGS_HELPER = config.dynamodb.settings_helper;
const DEFAULT_DEVICE = config.dynamodb.settings.default_device;

const RESPONSE = {
  failed: 'Fetching Spotify devices in settings failed',
};

/**
 * Fetch all spotifyDevices from Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} settings
 */
const getAllDevices = async (teamId, channelId, settings) => {
  const auth = await authSession(teamId, channelId);
  const {[DEFAULT_DEVICE]: defaultDevice} = settings ? settings : {};
  const spotifyDevices = await fetchDevices(auth);

  const devices = [
    ...defaultDevice ? [defaultDevice] : [], // If default device, add to list
    ...spotifyDevices.devices
        .filter((device) => (!defaultDevice || device.id !== defaultDevice.id))
        .map((device) => {
          const deviceObj = new Device(device);
          return modelDevice(deviceObj.name, deviceObj.id);
        }),
  ];
  return devices;
};

const main = async (teamId, channelId, settings) => {
  const spotifyDevices = await getAllDevices(teamId, channelId, settings);
  const devices = [
    option(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices), // Add a none option
    ...spotifyDevices
        .filter((device) => device.id != SETTINGS_HELPER.no_devices)
        .map((device) => option(device.name, device.id)),
  ];
  return {
    options: devices,
  };
};

module.exports.handler = async (event, context) => {
  // LAMBDA FUNCTION
  const {teamId, channelId, userId, settings} = event;
  return await main(teamId, channelId, settings)
      .catch(async (error)=>{
        logger.error(error, RESPONSE.failed);
        await reportErrorToSlack(channelId, userId, RESPONSE.failed);
      });
};

module.exports.RESPONSE = RESPONSE;
