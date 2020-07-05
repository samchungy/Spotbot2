const logger = require('/opt/utils/util-logger');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');
const sns = require('/opt/sns');


const {fetchTokens} = require('/opt/sonos/sonos-api');
const {storeSonosAuth, loadState} = require('/opt/sonos/sonos-auth/sonos-auth-interface');
const {modelSonosAuth} = require('/opt/sonos/sonos-auth/sonos-auth-model');
const {isEqual} = require('/opt/utils/util-objects');
const transform = require('/opt/utils/util-transform');

const SETTINGS_SONOS_AUTH_UPDATE_VIEW = process.env.SNS_PREFIX + 'settings-sonos-auth-update-view';

/**
 * Check that the state for Authorization is valid
 * @param {string} state
 */
async function verifyState(state) {
  try {
    const stateJson = JSON.parse(transform.decode64(decodeURIComponent(state)));
    // Check state is valid, else redirect.
    const currentState = await loadState(stateJson.teamId, stateJson.channelId);
    if (currentState && isEqual(stateJson, currentState.state)) {
      return currentState.state;
    }
  } catch (error) {
    logger.error('Verify state failed');
    logger.error(error);
  }
  return null;
}

/**
 * Validates our authentication for our Spotbot channel
 * @param {Object} event
 * @param {Object} context
 */
module.exports.handler = async (event, context) => {
  try {
    // LAMBDA FUNCTION
    const {code, state, url} = event;
    const stateJson = await verifyState(state);
    if (!stateJson) {
      return {success: false, failReason: 'Invalid State, please close the window and run /spotbot sonos again.'};
    }
    // Get Tokens from Spotify
    const tokens = await fetchTokens(code, `${url}/sonos-auth-callback`);
    console.log(tokens);
    const auth = modelSonosAuth(tokens.access_token, tokens.refresh_token, moment().add(1435, 'm').unix()); // 23 Hours 55 Minutes
    await storeSonosAuth(stateJson.teamId, stateJson.channelId, auth);

    const params = {
      Message: JSON.stringify({teamId: stateJson.teamId, channelId: stateJson.channelId, viewId: stateJson.viewId}),
      TopicArn: SETTINGS_SONOS_AUTH_UPDATE_VIEW,
    };
    await sns.publish(params).promise();
    return {success: true, failReason: null};
  } catch (error) {
    logger.error(error);
    return {success: false, failReason: `${error.message}`};
  }
};
