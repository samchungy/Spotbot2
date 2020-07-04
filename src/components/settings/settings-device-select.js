const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Settings
const {loadSettings} = require('/opt/db/settings-interface');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchDevices} = require('/opt/spotify/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const Device = require('/opt/spotify/spotify-objects/util-spotify-device');

// Slack
const {updateModal, postEphemeral} = require('/opt/slack/slack-api');
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {selectStatic, option, slackModal} = require('/opt/slack/format/slack-format-modal');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const DEVICE_MODAL = config.slack.actions.device_modal;
const DEFAULT_DEVICE = config.dynamodb.settings.default_device;

const DEVICE_RESPONSE = {
  default: (deviceName) => `Spotbot will try to keep playing on the current device despite what the default device is set as in the settings. When Spotify is not reporting a device, Spotbot will attempt to fallback onto the default. To change the default, please go to \`/spotbot settings\`.\n\n *Current Default Device:* ${deviceName}`,
  fail: ':x: Something went wrong! Could not open devices menu. Please try again.',
  hint: 'The device which you will be playing music through.',
  no_device: `:information_source: No devices currently open.`,
  title: 'Select a device',
};

/**
 * Get the Modal blocks for Device Modal
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {array} devices
 */
const getBlocks = async (teamId, channelId, auth, devices) => {
  const settings = await loadSettings(teamId, channelId);
  const defaultDevice = settings[DEFAULT_DEVICE];
  const status = await fetchCurrentPlayback(teamId, channelId, auth);

  const blocks = [
    textSection(DEVICE_RESPONSE.default(defaultDevice.name)),
    ...status.device ? [getStatusBlock(status, devices)] : [getDeviceBlock(devices)],
  ];
  return blocks;
};

const getDeviceBlock = (devices) => {
  const options = devices.map((device) => option(`${device.name} - ${device.type}`, device.id));
  return selectStatic(DEVICE_MODAL, DEVICE_RESPONSE.title, DEVICE_RESPONSE.hint, null, options, null);
};

const getStatusBlock = (status, devices) => {
  const statusDevice = new Device(status.device);
  const initial = option(`Current Device: ${statusDevice.name}`, statusDevice.id ? statusDevice.id : 'null');
  const options = [
    initial,
    ...devices.filter((device) => device.id != status.device.id).map((device) => {
      const deviceObj = new Device(device);
      return option(deviceObj.name, deviceObj.id);
    }),
  ];
  return selectStatic(DEVICE_MODAL, DEVICE_RESPONSE.title, DEVICE_RESPONSE.hint, initial, options, null);
};

const openDeviceModal = async (teamId, channelId, userId, viewId) => {
  const auth = await authSession(teamId, channelId);
  const spotifyDevices = await fetchDevices(teamId, channelId, auth);
  if (spotifyDevices.devices.length) {
    const blocks = await getBlocks(teamId, channelId, auth, spotifyDevices.devices);
    const modal = slackModal(DEVICE_MODAL, `Spotify Devices`, `Switch to Device`, `Cancel`, blocks, false, channelId);
    await updateModal(viewId, modal);
  } else {
    const message = ephemeralPost(channelId, userId, DEVICE_RESPONSE.no_device, null);
    await postEphemeral(message);
  }
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, viewId} = JSON.parse(event.Records[0].Sns.Message);
  await openDeviceModal(teamId, channelId, userId, viewId)
      .catch((error)=>{
        logger.error(error, DEVICE_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, DEVICE_RESPONSE.failed);
      });
};
