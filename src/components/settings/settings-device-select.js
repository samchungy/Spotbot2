const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Settings
const {loadSettings} = require('/opt/db/settings-interface');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchDevices} = require('/opt/spotify/spotify-api-v2/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const Device = require('/opt/spotify/spotify-objects/util-spotify-device');

// Slack
const {updateModal} = require('/opt/slack/slack-api');
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {selectStatic, option, slackModal} = require('/opt/slack/format/slack-format-modal');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const DEVICE_MODAL = config.slack.actions.device_modal;
const DEFAULT_DEVICE = config.dynamodb.settings.default_device;

const RESPONSE = {
  default: (deviceName) => `Spotbot will try to keep playing on the current device despite what the default device is set as in the settings. When Spotify is not reporting a device, Spotbot will attempt to fallback onto the default. To change the default, please go to \`/spotbot settings\`.\n\n *Current Default Device:* ${deviceName}`,
  fail: ':x: Something went wrong! Could not open devices menu. Please try again.',
  hint: 'The device which you will be playing music through.',
  no_device: `:information_source: No devices currently open.`,
  title: 'Select a device',
  current: (name) => `Current Device: ${name}`,
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
  const status = await fetchCurrentPlayback(auth);

  const blocks = [
    textSection(RESPONSE.default(defaultDevice.name)),
    getStatusBlock(status, devices),
  ];
  return blocks;
};

const getStatusBlock = (status, devices) => {
  const statusDevice = new Device(status.device);
  const initial = option(RESPONSE.current(statusDevice.name), statusDevice.id || 'null');
  const options = [
    initial,
    ...devices.filter((device) => device.id != statusDevice.id).map((device) => {
      const deviceObj = new Device(device);
      return option(deviceObj.name, deviceObj.id);
    }),
  ];
  return selectStatic(DEVICE_MODAL, RESPONSE.title, RESPONSE.hint, initial, options, null);
};

const main = async (teamId, channelId, userId, viewId) => {
  const auth = await authSession(teamId, channelId);
  const spotifyDevices = await fetchDevices(auth);
  if (spotifyDevices.devices.length) {
    const blocks = await getBlocks(teamId, channelId, auth, spotifyDevices.devices);
    const modal = slackModal(DEVICE_MODAL, `Spotify Devices`, `Switch to Device`, `Cancel`, blocks, false, channelId);
    await updateModal(viewId, modal);
  } else {
    const blocks = [textSection(RESPONSE.no_device)];
    const modal = slackModal(DEVICE_MODAL, `Spotify Devices`, null, `Close`, blocks, false, channelId);
    await updateModal(viewId, modal);
  }
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, viewId} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, userId, viewId)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
