const config = require(process.env.CONFIG);

const {fetchProfile} = require('/opt/spotify/spotify-api/spotify-api-profile');
const {fetchAuthorizeURL} = require('/opt/spotify/spotify-api/spotify-api-auth');
const {loadTokens} 
const {storeState} = require('/opt/spotify/spotify-auth/spotify-auth-dal');
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
 * Geenerate the authentication block in Settings modal.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} triggerId
 * @param {boolean} failState
 */
async function getAuthBlock(teamId, channelId, triggerId) {
  let authError;
  const authBlock = [];

  try {
    const 
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
      const url = await getAuthorizationURL(teamId, channelId, triggerId);
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

module.exports = {
  getAuthBlock,
  getAuthorizationURL,
};
