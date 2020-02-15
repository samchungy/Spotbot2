const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {AuthError, PremiumError} = require('/opt/errors/errors-auth');
const {fetchAuthorizeURL, fetchTokens} = require('../spotify-api/spotify-api-auth');
const {fetchProfile} = require('../spotify-api/spotify-api-profile');
const {loadState, storeState, storeTokens, storeView} = require('./spotifyauth-dal');
const {storeDefaultDevice, storePlaylist, storeProfile} = require('/opt/settings/settings-interface');
const {modelProfile, modelState, modelView} = require('/opt/settings/settings-model');
const {buttonSection} = require('/opt/slack/format/slack-format-modal');
const {contextSection, confirmObject} = require('/opt/slack/format/slack-format-blocks');
const {isEqual} = require('/opt/utils/util-objects');

const SETTINGS_AUTH = config.dynamodb.settings_auth;
const HINTS = {
  auth_verify: 'Click to verify Spotify authentication.',
  auth_verify_button: 'Verify',
  auth_urL_fail: 'Try again',
  auth_url_button: ':link: Authenticate with Spotify',
  reauth_confirm: `This will disable this channel's Spotbot functionality until Spotbot is reauthenticated.`,
  reauth_url_button: ':gear: Re-authenticate with Spotify',
};

const LABELS = {
  auth_url: 'Click to authenticate with Spotify.',
  auth_urL_fail: ':warning: Authentication attempt failed.',
  reauth_confirm: 'Are you sure?',
  reauth: 'Click to re-authenticate with Spotify.',
};

const AUTH_RESPONSE = {
  auth_statement: (user) => `:white_check_mark: Authenticated with ${user} - Spotify Premium`,
  premium_error: `:x: The Spotify account used is not a Premium account`,
};

/**
 * Resets the authentication
 * @param {string} teamId
 * @param {string} channelId
 */
async function changeAuthentication(teamId, channelId ) {
  try {
    await storeTokens(teamId, channelId, null, null);
    await Promise.all([
      storeDefaultDevice(teamId, channelId, null),
      storePlaylist(teamId, channelId, null),
    ]);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Generates a Spotify Authorization URL and stores a state in our db
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} triggerId
 */
async function getAuthorizationURL(teamId, channelId, triggerId) {
  try {
    // TODO Store triggerId as Spotify Auth state.
    const state = modelState(teamId, channelId, triggerId);
    const [, authUrl] = await Promise.all([storeState(teamId, channelId, state), fetchAuthorizeURL(teamId, channelId, encodeURI(JSON.stringify(state)))]);
    return authUrl;
  } catch (error) {
    logger.error(error);
    throw error;
    // TODO Handle status report to Slack
  }
}

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
 * Validate the authorization code returned via the callback
 * @param {string} code
 * @param {string} state
 */
async function validateAuthCode(code, state) {
  try {
    const stateJson = await verifyState(state);
    if (!stateJson) {
      return {success: false, failReason: 'Invalid State', state: stateJson};
    }
    // Get Tokens from Spotify
    const {access_token: accessToken, refresh_token: refreshToken} = await fetchTokens(stateJson.teamId, stateJson.channelId, code);
    // Store our tokens in our DB & Get Spotify URI for authenticator
    const [, profile] = await Promise.all([
      storeTokens(stateJson.teamId, stateJson.channelId, accessToken, refreshToken),
      fetchProfile(stateJson.teamId, stateJson.channelId),
    ]);
    await storeProfile(stateJson.teamId, stateJson.channelId,
        modelProfile(profile.id, profile.country),
    );

    return {success: true, failReason: null, state: stateJson};
  } catch (error) {
    logger.error(error);
    return {success: false, failReason: `${error.message}`, state: null};
    // TODO Handle status report to Slack
  }
}

/**
 * Geenerate the authentication block in Settings modal.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} triggerId
 * @param {boolean} failState
 */
async function getAuthBlock(teamId, channelId, triggerId) {
  let authError;
  const authBlock = [];
  const url = await getAuthorizationURL(teamId, channelId, triggerId);

  try {
    const profile = await fetchProfile(teamId, channelId );
    if (profile.product !== 'premium') {
      throw new PremiumError();
    } else {
      // Place authenticated blocks
      authBlock.push(
          buttonSection(SETTINGS_AUTH.reauth, LABELS.reauth, HINTS.reauth_url_button, null, null, SETTINGS_AUTH.reauth, confirmObject(LABELS.reauth_confirm, HINTS.reauth_confirm, 'Reset Authentication', 'Cancel')),
          contextSection(SETTINGS_AUTH.auth_confirmation, AUTH_RESPONSE.auth_statement(profile.display_name ? profile.display_name : profile.id)),
      );
    }
  } catch (error) {
    if (error instanceof AuthError) {
      authError = true;
      // We are not authenticated - push non-authenticated blocks
      authBlock.push(
          buttonSection(SETTINGS_AUTH.auth_url, LABELS.auth_url, HINTS.auth_url_button, null, url, null),
      );
      if (error instanceof PremiumError) {
        // If the user is not premium
        authBlock.push(
            contextSection(SETTINGS_AUTH.auth_error, AUTH_RESPONSE.premium_error),
        );
      }
    } else {
      throw error;
    }
  }
  return {
    authBlock,
    authError,
  };
}


/**
 * Save the ViewId from our Authentication attempt
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} viewId
 * @param {string} triggerId
 */
async function saveView(teamId, channelId, viewId, triggerId) {
  try {
    const store = modelView(viewId, triggerId);
    await storeView(teamId, channelId, store);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  changeAuthentication,
  getAuthBlock,
  getAuthorizationURL,
  saveView,
  validateAuthCode,
};
