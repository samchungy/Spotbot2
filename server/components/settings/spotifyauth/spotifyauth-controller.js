const config = require('config');
const logger = require('../../../util/util-logger');
const {AuthError, PremiumError} = require('../../../errors/errors-auth');
const {fetchAuthorizeURL, fetchTokens, fetchProfile} = require('../../spotify-api/spotify-api-auth');
const {loadState, storeState, storeTokens, storeProfile} = require('./spotifyauth-dal');
const {buttonSection, context} = require('../../slack/format/slack-format-modal');

const SETTINGS_HELPER = config.get('dynamodb.settings_helper');
const HINTS = config.get('settings.hints');
const LABELS = config.get('settings.labels');
const PREMIUM_ERROR = config.get('settings.errors.premium');
const AUTH_FAIL = config.get('settings.errors.fail');

/**
 * Generates a Spotify Authorization URL and stores a state in our db
 * @param {string} triggerId
 */
async function getAuthorizationURL(triggerId) {
  try {
    // TODO Store triggerId as Spotify Auth state.
    await storeState(triggerId);
    const authUrl = await fetchAuthorizeURL(triggerId);
    return authUrl;
  } catch (error) {
    logger.error(error);
    throw error;
    // TODO Handle status report to Slack
  }
}

/**
 * New Authentication Attempt, reset current auth
 */
async function resetAuthentication() {
  // Invalidate any previous auth we had
  await storeTokens(null, null);
}

/**
 * Check that the state for Authorization is valid
 * @param {string} state
 */
async function verifyState(state) {
  // Check state is valid, else redirect.
  const currentState = await loadState();
  return currentState === state;
  // TODO:
}

/**
 * Validate the authorization code returned via the callback
 * @param {string} code
 * @param {string} state
 */
async function validateAuthCode(code, state) {
  try {
    if (!await verifyState(state)) {
      return {success: false, failReason: 'Invalid State'};
    }
    // Get Tokens from Spotify
    const {access_token: accessToken, refresh_token: refreshToken} = await fetchTokens(code);
    // Store our tokens in our DB
    await storeTokens(accessToken, refreshToken);

    // Get Spotify URI for Authenticator
    const profile = await fetchProfile();
    await storeProfile(profile.id);

    return {success: true, failReason: null};
  } catch (error) {
    logger.error(error);
    return {success: false, failReason: `${error.message}`};
    // TODO Handle status report to Slack
  }
}

const authStatement = (user) => `:white_check_mark: Authenticated with ${user} - Spotify Premium`;

/**
 *
 * @param {string} triggerId
 * @param {boolean} failState
 */
async function getAuthBlock(triggerId, failState) {
  let authError;
  const authBlock = [];
  const url = await getAuthorizationURL(triggerId);

  try {
    const profile = await fetchProfile();
    if (profile.product !== 'premium') {
      throw new PremiumError();
    } else {
      // Place authenticated blocks
      authBlock.push(
          buttonSection(SETTINGS_HELPER.reauth, LABELS.reauth, HINTS.reauth_url_button, null, null, SETTINGS_HELPER.reauth),
          context(SETTINGS_HELPER.auth_confirmation, authStatement(profile.display_name ? profile.display_name : profile.id)),
      );
    }
  } catch (error) {
    if (error instanceof AuthError) {
      authError = true;
      // We are not authenticated - push non-authenticated blocks
      authBlock.push(
          buttonSection(SETTINGS_HELPER.auth_url, LABELS.auth_url, HINTS.auth_url_button, null, url, null),
      );
      if (error instanceof PremiumError) {
        // If the user is not premium
        authBlock.push(
            context(SETTINGS_HELPER.auth_error, PREMIUM_ERROR),
        );
      } else if (failState) {
        // If the user failed an authentication.
        authBlock.push(
            context(SETTINGS_HELPER.auth_error, AUTH_FAIL),
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

module.exports = {
  getAuthBlock,
  getAuthorizationURL,
  resetAuthentication,
  validateAuthCode,
};
