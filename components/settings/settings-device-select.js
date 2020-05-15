const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {loadSettings} = require('/opt/db/settings-interface');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchDevices} = require('/opt/spotify/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {updateModal, postEphemeral} = require('/opt/slack/slack-api');
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {selectStatic, option, slackModal} = require('/opt/slack/format/slack-format-modal');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const Device = require('/opt/spotify/spotify-objects/util-spotify-device');
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
async function getBlocks(teamId, channelId, auth, devices) {
  try {
    const settings = await loadSettings(teamId, channelId, [DEFAULT_DEVICE]);
    const defaultDevice = settings[DEFAULT_DEVICE];
    const blocks = [textSection(DEVICE_RESPONSE.default(defaultDevice.name))];
    let options;
    const status = await fetchCurrentPlayback(teamId, channelId, auth);
    if (status.device) {
      const statusDevice = new Device(status.device);
      const initial = option(`Current Device: ${statusDevice.name}`, statusDevice.id ? statusDevice.id : 'null');
      const options = [
        initial,
        ...devices.filter((device) => device.id != status.device.id).map((device) => {
          const deviceObj = new Device(device);
          return option(deviceObj.name, deviceObj.id);
        }),
      ];
      blocks.push(selectStatic(DEVICE_MODAL, DEVICE_RESPONSE.title, DEVICE_RESPONSE.hint, initial, options, null));
    } else {
      options = devices.map((device) => option(`${device.name} - ${device.type}`, device.id));
      blocks.push(selectStatic(DEVICE_MODAL, DEVICE_RESPONSE.title, DEVICE_RESPONSE.hint, null, options, null));
    }
    return blocks;
  } catch (error) {
    throw error;
  }
}

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, viewId} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const auth = await authSession(teamId, channelId);
    const spotifyDevices = await fetchDevices(teamId, channelId, auth);
    if (spotifyDevices.devices.length) {
      const blocks = await getBlocks(teamId, channelId, auth, spotifyDevices.devices);
      await updateModal(
          viewId,
          slackModal(DEVICE_MODAL, `Spotify Devices`, `Switch to Device`, `Cancel`, blocks, false, channelId),
      );
    } else {
      await postEphemeral(
          ephemeralPost(channelId, userId, DEVICE_RESPONSE.no_device, null),
      );
    }
  } catch (error) {
    logger.error('Open Device Modal failed');
    logger.error(error);
    try {
      await postEphemeral(
          ephemeralPost(channelId, userId, DEVICE_RESPONSE.fail, null),
      );
    } catch (error) {
      logger.error('Failed to report open device modal error');
      logger.error(error);
    }
  }
};
