const config = require(process.env.CONFIG);
const moment = require(process.env.MOMENT);
const logger = require(process.env.LOGGER);

const {fetchProfile} = require('/opt/spotify/spotify-api/spotify-api-profile');
const {fetchAuthorizeURL} = require('/opt/spotify/spotify-api/spotify-api-auth');
const {storeState} = require('/opt/db/spotify-auth-interface');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {AuthError, PremiumError} = require('/opt/errors/errors-auth');
const {buttonSection} = require('/opt/slack/format/slack-format-modal');
const {contextSection, confirmObject} = require('/opt/slack/format/slack-format-blocks');
const {modelState} = require('/opt/settings/settings-model');

const SETTINGS_AUTH = config.dynamodb.settings_auth;
const HINTS = {
  auth_verify: 'Click to verify Spotify authentication.',
  auth_verify_button: 'Verify',
  auth_urL_fail: 'Try again',
  auth_url_button: ':link: Authenticate with Spotify',
  reauth_confirm: `This will disable this channel's Spotbot functionality until Spotbot is re-authenticated.`,
  reauth_url_button: ':gear: Reset Spotify Authentication',
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
 * Geenerate the authentication block in Settings modal.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} viewId
 * @param {string} url
 */
async function getAuthBlock(teamId, channelId, viewId, url) {
  let authError;
  const authBlock = [];

  try {
    const auth = await authSession(teamId, channelId);
    if (!auth.getAccess()) {
      throw new AuthError();
    }
    const profile = await fetchProfile(teamId, channelId, auth);
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
      try {
        const noAuth = await authSession(teamId, channelId, url);
        const authUrl = await getAuthorizationURL(teamId, channelId, noAuth, viewId, url);
        authBlock.push(
            buttonSection(SETTINGS_AUTH.auth_url, LABELS.auth_url, HINTS.auth_url_button, null, authUrl, null),
        );
        if (error instanceof PremiumError) {
          // If the user is not premium
          authBlock.push(
              contextSection(SETTINGS_AUTH.auth_error, AUTH_RESPONSE.premium_error),
          );
        }
      } catch (realError) {
        throw realError;
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
 * Generates a Spotify Authorization URL and stores a state in our db
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} viewId
 * @param {string} url
 */
async function getAuthorizationURL(teamId, channelId, auth, viewId, url) {
  try {
    // TODO Store triggerId as Spotify Auth state.
    const state = modelState(teamId, channelId, viewId);
    const [, authUrl] = await Promise.all([storeState(teamId, channelId, {state: state}, moment().add(1, 'hour').unix()), fetchAuthorizeURL(teamId, channelId, auth, encodeURI(JSON.stringify(state)), `${url}/${SETTINGS_AUTH.auth_url}`)]);
    return authUrl;
  } catch (error) {
    logger.error(error);
    throw error;
    // TODO Handle status report to Slack
  }
}

module.exports = {
  getAuthBlock,
  getAuthorizationURL,
};
