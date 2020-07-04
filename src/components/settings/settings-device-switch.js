const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {transferDevice} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {fetchDevices} = require('/opt/spotify/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const Device = require('/opt/spotify/spotify-objects/util-spotify-device');

// Slack
const {postEphemeral, post} = require('/opt/slack/slack-api');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const DEVICE_MODAL = config.slack.actions.device_modal;
const DEVICE_RESPONSE = {
  select: (device, user) => `:arrows_clockwise: Playback on Spotbot was switched to ${device} by <@${user}>.`,
  select_fail: `:information_source: The selected device is no longer available to switch to.`,
  failed: 'Switching devices failed',
};

const switchDevice = async (teamId, channelId, userId, view) => {
  const auth = await authSession(teamId, channelId);
  const submission = extractSubmission(view);

  if (submission) {
    const status = await fetchCurrentPlayback(teamId, channelId, auth);
    if (submission.value == 'null' || (status && status.device && status.device.id == submission.value)) {
      return;
    }
    const spotifyDevices = await fetchDevices(teamId, channelId, auth);
    const device = spotifyDevices.devices.find((device) => device.id === submission.value);
    if (device) {
      const deviceObj = new Device(device);
      await transferDevice(teamId, channelId, auth, submission.value);
      const message = inChannelPost(channelId, DEVICE_RESPONSE.select(deviceObj.name, userId), null);
      return await post(message);
    }
  }
  const message = ephemeralPost(channelId, userId, DEVICE_RESPONSE.select_fail, null);
  await postEphemeral(message);
};

/**
 * Extract the results from the submitted Slack modal view
 * @param {object} view
 * @return {Object} Submission values
 */
const extractSubmission = (view) => {
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
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, view} = JSON.parse(event.Records[0].Sns.Message);
  await switchDevice(teamId, channelId, userId, view)
      .catch((error)=>{
        logger.error(error, DEVICE_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, DEVICE_RESPONSE.failed);
      });
};
