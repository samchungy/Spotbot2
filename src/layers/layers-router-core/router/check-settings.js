const config = require('/opt/config/config');

// Errors
const {ChannelAdminError, SettingsError, SetupError} = require('/opt/errors/errors-settings');

// Settings
const {loadSettings} = require('/opt/db/settings-interface');

// Slack
const {getConversationInfo} = require('/opt/slack/slack-api');

const PLAYLIST = config.dynamodb.settings.playlist;
const CHANNEL_ADMINS = config.dynamodb.settings.channel_admins;

const ERROR_MESSAGES = {
  admin_error: (users) => `:information_source: You must be a Spotbot admin for this channel to use this command. Current channel admins: ${users.map((user)=>`<@${user}>`).join(', ')}.`,
  setup_error: ':information_source: Spotbot is not installed in this channel. Please run `/invite @spotbot` and try again.',
  settings_error: ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.',
};

/**
 * Determine if Spotbot settings are set
 * @param {string} teamId
 * @param {string} channelId
 * @param {*} settings
 */
const checkIsSetup = async (teamId, channelId, settings) => {
  settings = settings !== undefined ? settings : await loadSettings(teamId, channelId);
  if (settings && settings[PLAYLIST]) {
    return settings;
  } else {
    return Promise.reject(new SettingsError(ERROR_MESSAGES.settings_error));
  }
};

/**
 * Determine if Spotbot is installed in channel
 * @param {string} teamId
 * @param {string} channelId
 */
const checkIsPreviouslySetup = async (teamId, channelId) => {
  const settings = await loadSettings(teamId, channelId);
  if (settings) {
    return settings;
  } else {
    return Promise.reject(new SetupError(ERROR_MESSAGES.setup_error));
  }
};

/**
 * Checks if user is an admin
 * @param {Object} settings
 * @param {string} userId
 * @return {*}
 */
const checkIsAdmin = async (settings, userId) => {
  if (settings[CHANNEL_ADMINS].includes(userId)) {
    return true;
  }
  return Promise.reject(new ChannelAdminError(ERROR_MESSAGES.admin_error(settings[CHANNEL_ADMINS])));
};


/**
 * Determine if Spotbot is in channel
 * @param {string} channelId
 */
const checkIsInChannel = async (channelId) => {
  const info = await getConversationInfo(channelId);
  if (info.ok && info.channel && info.channel.is_member) {
    return true;
  }
  return false;
};

module.exports = {
  checkIsAdmin,
  checkIsInChannel,
  checkIsSetup,
  checkIsPreviouslySetup,
};
