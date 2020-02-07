const config = require('config');
const logger = require('../../../util/util-logger');
const {loadDefaultDevice} = require('../settings-interface');
const {transferDevice} = require('../../spotify-api/spotify-api-playback');
const {fetchDevices} = require('../../spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('../../spotify-api/spotify-api-playback-status');
const {sendModal, postEphemeral, post} = require('../../slack/slack-api');
const {textSection} = require('../../slack/format/slack-format-blocks');
const {selectStatic, option, slackModal} = require('../../slack/format/slack-format-modal');
const {ephemeralPost, inChannelPost} = require('../../slack/format/slack-format-reply');
const Device = require('../../../util/util-spotify-device');
const DEVICE_MODAL = config.get('slack.actions.device_modal');

const DEVICE_RESPONSE = {
  default: (deviceName) => `Spotbot will try to keep playing on the current device despite what the default device is set as in the settings. When Spotify is not reporting a device, Spotbot will attempt to fallback onto the default. To change the default, please go to \`/spotbot settings\`.\n\n *Current Default Device:* ${deviceName}`,
  hint: 'The device which you will be playing music through',
  no_device: `:information_source: No devices currently open.`,
  title: 'Select a device',
  select: (device, user) => `:arrows_clockwise: Playback on Spotbot was switched to ${device} by <@${user}>.`,
  select_fail: `:information_source: The selected device is no longer available to switch to`,
};

/**
 * Open a device modal for Users to change spotify audio source
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} triggerId
 */
async function openDevicesModal(teamId, channelId, userId, triggerId) {
  try {
    const spotifyDevices = await fetchDevices(teamId, channelId);
    if (spotifyDevices.devices.length) {
      const blocks = await getBlocks(teamId, channelId, spotifyDevices.devices);
      await sendModal(
          triggerId,
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
  }
}

/**
 * Open a device modal for Users to change spotify audio source
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} view
 */
async function switchDevice(teamId, channelId, userId, view) {
  try {
    const submission = extractSubmission(view);
    if (submission) {
      const status = await fetchCurrentPlayback(teamId, channelId);
      if (status && status.device && status.device.id == submission.value) {
        return;
      }
      const spotifyDevices = await fetchDevices(teamId, channelId);
      const device = spotifyDevices.devices.find((device) => device.id === submission.value);
      if (device) {
        const deviceObj = new Device(device);
        await transferDevice(teamId, channelId, submission.value);
        await post(
            inChannelPost(channelId, DEVICE_RESPONSE.select(deviceObj.name, userId), null),
        );
        return;
      }
    }
    await postEphemeral(
        ephemeralPost(channelId, userId, DEVICE_RESPONSE.select_fail, null),
    );
  } catch (error) {
    logger.error(error);
    logger.error('Open Device Modal failed');
  }
}

/**
 * Extract the results from the submitted Slack modal view
 * @param {object} view
 * @return {Object} Submission values
 */
function extractSubmission(view) {
  const values = view.state.values;
  let submission;
  for (const device in values) {
    if ({}.hasOwnProperty.call(values, device)) {
      switch (device) {
        case DEVICE_MODAL:
          submission = values[device][device].selected_option;
          break;
      }
    }
  }
  return submission;
}

/**
 * Get the Modal blocks for Device Modal
 * @param {string} teamId
 * @param {string} channelId
 * @param {array} devices
 */
async function getBlocks(teamId, channelId, devices) {
  try {
    const defaultDevice = await loadDefaultDevice(teamId, channelId);
    const blocks = [textSection(DEVICE_RESPONSE.default(defaultDevice.name))];
    let options;
    const status = await fetchCurrentPlayback(teamId, channelId);
    if (status.device) {
      const statusDevice = new Device(status.device);
      const initial = option(`Current Device: ${statusDevice.name}`, statusDevice.id);
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

module.exports = {
  openDevicesModal,
  switchDevice,
};
