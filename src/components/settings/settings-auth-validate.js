const logger = require('/opt/utils/util-logger');
const config = require('/opt/config/config');
const moment = require(/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030);

const sns = require('/opt/sns');

// Spotify
const {loadState, storeAuth, changeProfile} = require('/opt/db/spotify-auth-interface');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchTokens} = require('/opt/spotify/spotify-api/spotify-api-auth');
const {fetchProfile} = require('/opt/spotify/spotify-api/spotify-api-profile');

// Utlity
const {isEqual} = require('/opt/utils/util-objects');
const transform = require('/opt/utils/util-transform');

// CONFIG
const SETTINGS_AUTH_UPDATE_VIEW = process.env.SNS_PREFIX + 'settings-auth-update-view';
const SETTINGS_AUTH = config.dynamodb.settings_auth;

const decodeState = (state) => transform.decode64(decodeURIComponent(state));

// Verifies that our attempt came from a legitimate source
const verifyState = async (state) => {
  try {
    const stateJson = JSON.parse(decodeState(state));
    // Check state is valid, else redirect.
    const currentState = await loadState(stateJson.teamId, stateJson.channelId);
    if (currentState && isEqual(stateJson, currentState.state)) {
      return currentState.state;
    }
  } catch (error) {
    logger.error(error, 'Verify State failed');
    throw error;
  }
};

// Exchanges our code for an access token and refresh token
const getTokens = async (teamId, channelId, code, url) => {
  const noAuth = await authSession(teamId, channelId);
  const {access_token: accessToken, refresh_token: refreshToken} = await fetchTokens(teamId, channelId, noAuth, code, `${url}/${SETTINGS_AUTH.auth_url}`);
  await storeAuth(teamId, channelId, accessToken, refreshToken, moment().add(55, 'm').unix());
};

// Fetches Spotify Profile and stores in our auth object
const storeProfile = async (teamId, channelId) => {
  const auth = await authSession(teamId, channelId);
  const profile = await fetchProfile(teamId, channelId, auth);
  await changeProfile(teamId, channelId, profile.id, profile.country);
};

const startValidation = async (code, state, url) => {
  const stateJson = await verifyState(state);
  await getTokens(stateJson.teamId, stateJson.channelId, code, url);
  await storeProfile(stateJson.teamId, stateJson.channelId);

  const params = {
    Message: JSON.stringify({teamId: stateJson.teamId, channelId: stateJson.channelId, viewId: stateJson.viewId}),
    TopicArn: SETTINGS_AUTH_UPDATE_VIEW,
  };
  await sns.publish(params).promise();

  return null;
};

/**
 * Validates our authentication for our Spotbot channel
 * @param {Object} event
 * @param {Object} context
 */
module.exports.handler = async (event, context) => {
  // LAMBDA FUNCTION
  const {code, state, url} = event;
  return await startValidation(code, state, url)
      .catch((error) =>{
        logger.error(error, 'Settings Auth Validation failed');
        return 'An error occured. Please close Spotbot Settings and run /spotbot settings to try again.';
      });
};
