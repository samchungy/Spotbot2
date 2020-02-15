const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);
const {storeProfile} = require('/opt/settings/settings-interface');
const {loadState, storeTokens} = require('/opt/spotify/spotify-auth/spotify-auth-dal');
const {fetchTokens} = require('/opt/spotify/spotify-api/spotify-api-auth');
const {fetchProfile} = require('/opt/spotify/spotify-api/spotify-api-profile');
const {modelProfile} = require('/opt/settings/settings-model');
const {isEqual} = require('/opt/utils/util-objects');

/**
 * Check that the state for Authorization is valid
 * @param {string} state
 */
async function verifyState(state) {
  try {
    const stateJson = JSON.parse(state);
    // Check state is valid, else redirect.
    const currentState = await loadState(stateJson.teamId, stateJson.channelId);
    if (isEqual(stateJson, currentState)) {
      return currentState;
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
    const {code, state} = event;
    const stateJson = await verifyState(state);
    if (!stateJson) {
      return {success: false, failReason: 'Invalid State', state: null};
    }
    // Get Tokens from Spotify
    const {access_token: accessToken, refresh_token: refreshToken} = await fetchTokens(stateJson.teamId, stateJson.channelId, code);
    // Store our tokens in our DB & Get Spotify URI for authenticator
    await storeTokens(stateJson.teamId, stateJson.channelId, accessToken, refreshToken, moment().add(55, 'm').toISOString());
    const profile = await fetchProfile(stateJson.teamId, stateJson.channelId);
    await storeProfile(stateJson.teamId, stateJson.channelId,
        modelProfile(profile.id, profile.country),
    );
    return {success: true, failReason: null, state: stateJson};
  } catch (error) {
    logger.error(error);
    return {success: false, failReason: `${error.message}`, state: null};
  }
};
