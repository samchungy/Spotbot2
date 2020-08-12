const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {transferDevice} = require('/opt/spotify/spotify-api-v2/spotify-api-playback');
const {fetchDevices} = require('/opt/spotify/spotify-api-v2/spotify-api-devices');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const Device = require('/opt/spotify/spotify-objects/util-spotify-device');

// Slack
const {postEphemeral, post} = require('/opt/slack/slack-api');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const DEVICE_MODAL = config.slack.actions.device_modal;
const RESPONSE = {
  select: (device, user) => `:arrows_clockwise: Playback on Spotbot was switched to ${device} by <@${user}>.`,
  select_fail: `:information_source: The selected device is no longer available to switch to.`,
  failed: 'Switching devices failed',
};

const main = async (teamId, channelId, userId, view) => {
  const auth = await authSession(teamId, channelId);
  const submission = extractSubmission(view);

  if (submission) {
    const status = await fetchCurrentPlayback(auth);
    if (submission.value == 'null' || (status && status.device && status.device.id == submission.value)) {
      return;
    }
    const spotifyDevices = await fetchDevices(auth);
    const device = spotifyDevices.devices.find((device) => device.id === submission.value);
    if (device) {
      const deviceObj = new Device(device);
      await transferDevice(auth, deviceObj.id);
      const message = inChannelPost(channelId, RESPONSE.select(deviceObj.name, userId), null);
      return await post(message);
    }
  }
  const message = ephemeralPost(channelId, userId, RESPONSE.select_fail, null);
  await postEphemeral(message);
};

/**
 * Extract the results from the submitted Slack modal view
 * @param {object} view
 * @return {Object} Submission values
 */
const extractSubmission = (view) => {
  const values = view.state.values;
  const submission = Object.entries(values).reduce((sub, [device, value]) => {
    switch (device) {
      case DEVICE_MODAL:
        sub = value[device].selected_option;
        break;
    }
    return sub;
  }, null);
  return submission;
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, view} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, userId, view)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
