const config = require('/opt/config/config');

// Errors
const {ChannelAdminError, SettingsError} = require('/opt/errors/errors-settings');

// Settings
const {loadSettings} = require('/opt/db/settings-interface');

const PLAYLIST = config.dynamodb.settings.playlist;
const CHANNEL_ADMINS = config.dynamodb.settings.channel_admins;

const ERROR_MESSAGES = {
  admin_error: (users) => `:information_source: You must be a Spotbot admin for this channel to use this command. Current channel admins: ${users.map((user)=>`<@${user}>`).join(', ')}.`,
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
  }
  return Promise.reject(new SettingsError(ERROR_MESSAGES.settings_error));
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

module.exports = {
  checkIsAdmin,
  checkIsSetup,
  checkIsPreviouslySetup,
  ERROR_MESSAGES,
};
