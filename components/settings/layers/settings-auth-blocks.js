const config = require(process.env.CONFIG);
const moment = require(process.env.MOMENT);
const logger = require(process.env.LOGGER);

// Spotify
const {fetchProfile} = require('/opt/spotify/spotify-api/spotify-api-profile');
const {fetchAuthorizeURL} = require('/opt/spotify/spotify-api/spotify-api-auth');
const {modelState, storeState} = require('/opt/db/spotify-auth-interface');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');

// Errors
const {AuthError, PremiumError} = require('/opt/errors/errors-auth');

// Slack
const {buttonSection} = require('/opt/slack/format/slack-format-modal');
const {contextSection, confirmObject} = require('/opt/slack/format/slack-format-blocks');

// Utlity
const transform = require('/opt/utils/util-transform');

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

// Utility Functions
const validateAuth = async (auth) => auth.getAccess() ? Promise.resolve() : Promise.reject(new AuthError());
const validateProfile = async (teamId, channelId, auth) => {
  const profile = await fetchProfile(teamId, channelId, auth);
  if (profile.product !== 'premium') {
    throw new PremiumError();
  }
  return profile;
};

// Spotify auth url
const getAuthorizationURL = async (teamId, channelId, auth, viewId, url) => {
  const state = modelState(teamId, channelId, viewId);
  const encodedState = encodeURIComponent(transform.encode64(JSON.stringify(state)));
  return await Promise.all([
    storeState(teamId, channelId, {state}, moment().add(1, 'hour').unix()),
    fetchAuthorizeURL(teamId, channelId, auth, encodedState, `${url}/${SETTINGS_AUTH.auth_url}`),
  ]).then(([, authUrl]) => authUrl);
};

/** -------------------------- BLOCKS -------------------------- **/

// Authenticated Block
const getProfileBlock = (profile) => [
  buttonSection(SETTINGS_AUTH.reauth, LABELS.reauth, HINTS.reauth_url_button, null, null, SETTINGS_AUTH.reauth, confirmObject(LABELS.reauth_confirm, HINTS.reauth_confirm, 'Reset Authentication', 'Cancel')),
  contextSection(SETTINGS_AUTH.auth_confirmation, AUTH_RESPONSE.auth_statement(profile.display_name ? profile.display_name : profile.id)),
];

// Non-Authenticated Block
const getNoAuthBlock = async (teamId, channelId, viewId, url, premiumError) => {
  const noAuth = await authSession(teamId, channelId, url);
  const authUrl = await getAuthorizationURL(teamId, channelId, noAuth, viewId, url);
  return [
    buttonSection(SETTINGS_AUTH.auth_url, LABELS.auth_url, HINTS.auth_url_button, null, authUrl, null),
    ...premiumError ? [contextSection(SETTINGS_AUTH.auth_error, AUTH_RESPONSE.premium_error)] : [],
  ];
};

const getAuthBlock = async (teamId, channelId, viewId, url) => {
  const auth = await authSession(teamId, channelId);
  return await Promise.all([
    validateAuth(auth),
    validateProfile(teamId, channelId, auth),
  ])
      .then(([, profile]) => ({
        authBlock: getProfileBlock(profile),
        authError: false,
      }))
      .catch(async (err) => {
        if (err instanceof AuthError) {
          return {
            authBlock: await getNoAuthBlock(teamId, channelId, viewId, url, (err instanceof PremiumError)),
            authError: true,
          };
        }
        logger.error('Failed to generate AuthBlock');
        logger.error(err);
        throw err;
      });
};

module.exports = {
  getAuthBlock,
  getAuthorizationURL,
};
