const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {loadSettings} = require('/opt/settings/settings-interface');
const {postEphemeral, reply, getConversationInfo} = require('/opt/slack/slack-api');
const {ephemeralPost, ephemeralReply} = require('/opt/slack/format/slack-format-reply');

const PLAYLIST = config.dynamodb.settings.playlist;
const CHANNEL_ADMINS = config.dynamodb.settings.channel_admins;

const MIDDLEWARE_RESPONSE = {
  admin_error: (users) => `:information_source: You must be a Spotbot admin for this channel to use this command. Current channel admins: ${users.map((user)=>`<@${user}>`).join(', ')}.`,
  channel_error: `:information_source: Spotbot is not installed in this channel. Please add the Spotbot app to this channel and try again.`,
  settings_error: ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.',
};

/**
 * Determine if Spotbot settings are set
 * @param {string} teamId
 * @param {string} channelId
 */
async function checkIsSetup(teamId, channelId) {
  try {
    const settings = await loadSettings(teamId, channelId);
    if (settings && settings[PLAYLIST]) {
      return settings;
    } else {
      return false;
    };
  } catch (error) {
    logger.error(error);
    return false;
  }
}

/**
 * Determine if Spotbot is in channel
 * @param {string} channelId
 * @param {string} responseUrl
 */
async function checkIsInChannel(channelId, responseUrl) {
  try {
    const info = await getConversationInfo(channelId);
    if (info.ok && info.channel && info.channel.is_member) {
      return true;
    }
    await reply(
        ephemeralReply(MIDDLEWARE_RESPONSE.channel_error),
        responseUrl,
    );
  } catch (error) {
    logger.error(error);
  }
  return false;
}

/**
 * Checks if settings are set.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} responseUrl
 */
async function checkSettings(teamId, channelId, userId, responseUrl) {
  try {
    const settings = await checkIsSetup(teamId, channelId);
    if (!settings) {
      if (responseUrl) {
        await reply(
            ephemeralReply(MIDDLEWARE_RESPONSE.settings_error, null),
            responseUrl,
        );
      } else {
        await postEphemeral(
            ephemeralPost(channelId, userId, MIDDLEWARE_RESPONSE.settings_error, null),
        );
      }
      return false;
    }
    return settings;
  } catch (error) {
    throw error;
  }
}

/**
 * Checks if settings are set. (Koa Middleware)
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} settings
 * @param {string} userId
 */
async function checkIsAdmin(teamId, channelId, settings, userId) {
  try {
    if (settings && settings[CHANNEL_ADMINS] && settings[CHANNEL_ADMINS].includes(userId)) {
      return settings;
    };
    await postEphemeral(
        ephemeralPost(channelId, userId, MIDDLEWARE_RESPONSE.admin_error(settings[CHANNEL_ADMINS]), null),
    );
    return false;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  checkIsInChannel,
  checkIsAdmin,
  checkSettings,
  checkIsSetup,
};
