const config = require('config');
const logger = require('../../../util/util-logger');
const {AuthError, PremiumError} = require('../../../errors/errors-auth');
const {fetchAuthorizeURL, fetchTokens} = require('../../spotify-api/spotify-api-auth');
const {fetchProfile} = require('../../spotify-api/spotify-api-profile');
const {loadState, storeState, storeView, storeTokens} = require('./spotifyauth-dal');
const {storeProfile} = require('../settings-dal');
const {modelProfile, modelState, modelView} = require('../settings-model');
const {buttonSection} = require('../../slack/format/slack-format-modal');
const {contextSection, confirmObject} = require('../../slack/format/slack-format-blocks');
const {isEqual} = require('../../../util/util-objects');

const SETTINGS_AUTH = config.get('dynamodb.settings_auth');
const HINTS = config.get('settings.hints');
const LABELS = config.get('settings.labels');
const PREMIUM_ERROR = config.get('settings.errors.premium');

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
 * New Authentication Attempt, reset current auth
 * @param {string} teamId
 * @param {string} channelId
 */
async function resetAuthentication(teamId, channelId) {
  // Invalidate any previous auth we had
  await storeTokens(teamId, channelId, null, null);
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

const authStatement = (user) => `:white_check_mark: Authenticated with ${user} - Spotify Premium`;

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
          contextSection(SETTINGS_AUTH.auth_confirmation, authStatement(profile.display_name ? profile.display_name : profile.id)),
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
            contextSection(SETTINGS_AUTH.auth_error, PREMIUM_ERROR),
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
  getAuthBlock,
  getAuthorizationURL,
  resetAuthentication,
  saveView,
  validateAuthCode,
};
