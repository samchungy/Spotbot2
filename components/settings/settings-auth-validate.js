const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);
const moment = require(process.env.MOMENT);
const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();

const {loadState, storeSpotifyAuth, changeSpotifyAuth} = require('/opt/spotify/spotify-auth/spotify-auth-interface');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {modelSpotifyAuth, modelProfile} = require('/opt/spotify/spotify-auth/spotify-auth-model');
const {fetchTokens} = require('/opt/spotify/spotify-api/spotify-api-auth');
const {fetchProfile} = require('/opt/spotify/spotify-api/spotify-api-profile');
const {isEqual} = require('/opt/utils/util-objects');

const SETTINGS_AUTH_UPDATE_VIEW = process.env.SNS_PREFIX + 'settings-auth-update-view';
const SETTINGS_AUTH = config.dynamodb.settings_auth;

const PROFILE = config.dynamodb.auth.profile;

/**
 * Check that the state for Authorization is valid
 * @param {string} state
 */
async function verifyState(state) {
  try {
    const stateJson = JSON.parse(state);
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
      return {success: false, failReason: 'Invalid State, please close the window and run /spotbot settings again.'};
    }
    // Get Tokens from Spotify
    let auth = await authSession(stateJson.teamId, stateJson.channelId);
    const {access_token: accessToken, refresh_token: refreshToken} = await fetchTokens(stateJson.teamId, stateJson.channelId, auth, code, `${url}/${process.env.ENV}/${SETTINGS_AUTH.auth_url}`);
    // Store our tokens in our DB & Get Spotify URI for authenticator
    const authModel = modelSpotifyAuth(accessToken, refreshToken, moment().add(55, 'm').toISOString(), null);
    await storeSpotifyAuth(stateJson.teamId, stateJson.channelId, authModel);
    auth = await authSession(stateJson.teamId, stateJson.channelId);
    const profile = await fetchProfile(stateJson.teamId, stateJson.channelId, auth);
    await changeSpotifyAuth(stateJson.teamId, stateJson.channelId, [
      {key: PROFILE, value: modelProfile(profile.id, profile.country)},
    ]);
    const params = {
      Message: JSON.stringify({teamId: stateJson.teamId, channelId: stateJson.channelId, viewId: stateJson.viewId}),
      TopicArn: SETTINGS_AUTH_UPDATE_VIEW,
    };
    await sns.publish(params).promise();
    return {success: true, failReason: null};
  } catch (error) {
    logger.error(error);
    return {success: false, failReason: `${error.message}`};
  }
};
