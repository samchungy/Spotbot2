const config = require('/opt/config/config');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');
const logger = require('/opt/utils/util-logger');

// Spotify
const {fetchProfile} = require('/opt/spotify/spotify-api-v2/spotify-api-profile');
const {fetchAuthUrl} = require('/opt/spotify/spotify-api-v2/spotify-api-auth');
const {modelState, storeState} = require('/opt/db/spotify-auth-interface');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');

// Errors
const {AuthError, PremiumError} = require('/opt/errors/errors-spotify');

// Slack
const {buttonSection} = require('/opt/slack/format/slack-format-modal');
const {contextSection, confirmObject} = require('/opt/slack/format/slack-format-blocks');

// Utlity
const transform = require('/opt/utils/util-transform');
const SCOPES = config.spotify_api.scopes;

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
const RESPONSE = {
  auth_statement: (user) => `:white_check_mark: Authenticated with ${user} - Spotify Premium`,
  premium_error: `:x: The Spotify account used is not a Premium account`,
};

// Utility Functions
const validateAuth = async (auth) => await auth.getAccess() ? Promise.resolve() : Promise.reject(new AuthError());
const validateProfile = async (auth) => {
  const profile = await fetchProfile(auth);
  if (profile.product !== 'premium') {
    throw new PremiumError();
  }
  return profile;
};

// Spotify auth url
const getAuthorizationURL = async (teamId, channelId, viewId, url) => {
  const state = modelState(teamId, channelId, viewId);
  const encodedState = encodeURIComponent(transform.encode64(JSON.stringify(state)));
  return await Promise.all([
    storeState(teamId, channelId, {state}, moment().add(1, 'hour').unix()),
    fetchAuthUrl(SCOPES, `${url}/${SETTINGS_AUTH.auth_url}`, encodedState),
  ]).then(([, authUrl]) => authUrl);
};

/** -------------------------- BLOCKS -------------------------- **/

// Authenticated Block
const getProfileBlock = (profile) => [
  buttonSection(SETTINGS_AUTH.reauth, LABELS.reauth, HINTS.reauth_url_button, null, null, SETTINGS_AUTH.reauth, confirmObject(LABELS.reauth_confirm, HINTS.reauth_confirm, 'Reset Authentication', 'Cancel')),
  contextSection(SETTINGS_AUTH.auth_confirmation, RESPONSE.auth_statement(profile.display_name ? profile.display_name : profile.id)),
];

// Non-Authenticated Block
const getNoAuthBlock = async (teamId, channelId, viewId, url, premiumError) => {
  const authUrl = await getAuthorizationURL(teamId, channelId, viewId, url);
  return [
    buttonSection(SETTINGS_AUTH.auth_url, LABELS.auth_url, HINTS.auth_url_button, null, authUrl, null),
    ...premiumError ? [contextSection(SETTINGS_AUTH.auth_error, RESPONSE.premium_error)] : [],
  ];
};

const getAuthBlock = async (teamId, channelId, viewId, url) => {
  const auth = await authSession(teamId, channelId);
  return (async () => (await validateAuth(auth), await validateProfile(auth)))()
      .then((profile) => ({
        authBlock: getProfileBlock(profile),
        authError: false,
      }))
      .catch(async (error) => {
        if (error instanceof AuthError) {
          return {
            authBlock: await getNoAuthBlock(teamId, channelId, viewId, url, (error instanceof PremiumError)),
            authError: true,
          };
        }
        logger.error(error, 'Failed to generate AuthBlock');
        throw error;
      });
};

module.exports = {
  getAuthBlock,
  getAuthorizationURL,
  HINTS,
  RESPONSE,
  LABELS,
};
