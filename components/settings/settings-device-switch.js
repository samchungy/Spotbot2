const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {transferDevice} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {fetchDevices} = require('/opt/spotify/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {postEphemeral, post} = require('/opt/slack/slack-api');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');
const Device = require('/opt/spotify/spotify-objects/util-spotify-device');
const DEVICE_MODAL = config.slack.actions.device_modal;

const DEVICE_RESPONSE = {
  select: (device, user) => `:arrows_clockwise: Playback on Spotbot was switched to ${device} by <@${user}>.`,
  select_fail: `:information_source: The selected device is no longer available to switch to.`,
  fail: ':x: Something went wrong! Could not switch devices. Please try again.',
};

/**
 * Open a device modal for Users to change spotify audio source
 * @param {Object} event
 * @param {Object} context
 */
module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, view} = JSON.parse(event.Records[0].Sns.Message);
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
    logger.error('Switch Device failed');
    try {
      await postEphemeral(
          ephemeralPost(channelId, userId, DEVICE_RESPONSE.fail, null),
      );
    } catch (error) {
      logger.error(error);
      logger.error('Failed to report Switch Device fail');
    }
  }
};

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
