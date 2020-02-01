const config = require('config');
const logger = require('../../util/util-logger');
const moment = require('moment-timezone');
const {multiSelectUsers, option, slackModal, selectExternal, selectStatic, textInput, yesOrNo} = require('../slack/format/slack-format-modal');
const {sendModal, updateModal} = require('../slack/slack-api');
const {getAuthBlock, resetAuthentication} = require('./spotifyauth/spotifyauth-controller');
const {loadView} = require('./spotifyauth/spotifyauth-dal');
const {getAllPlaylists} = require('./settings-playlists');
const {getAllDevices} = require('./settings-device');
const {getAllTimezones} = require('./settings-timezones');
const {transformValue} = require('./settings-transform');
const {extractBlocks, extractSubmissions, verifySettings} = require('./settings-verify');

const {loadSettings, storeDeviceSetting, storePlaylistSetting, storeSettings} = require('./settings-dal');

const {ephemeralPost} = require('../slack/format/slack-format-reply');
const {postEphemeral} = require('../slack/slack-api');

const {isEqual, isEmpty} = require('../../util/util-objects');

const HINTS = config.get('settings.hints');
const LABELS = config.get('settings.labels');
const QUERY = config.get('settings.query_lengths');
const LIMITS = config.get('settings.limits');
const PLACE = config.get('settings.placeholders');
const SETTINGS_MODAL = config.get('slack.actions.settings_modal');
const DB = config.get('dynamodb.settings');
const RESPONSES = config.get('slack.responses');

/**
 * Resets the authentication
 * @param {string} teamId
 * @param {string} channelId
 */
async function changeAuthentication(teamId, channelId ) {
  try {
    await resetAuthentication(teamId, channelId );
    await Promise.all([
      storeDeviceSetting(teamId, channelId, null),
      storePlaylistSetting(teamId, channelId, null),
    ]);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Open the Spotbot Settings Panel via Slack Modal.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} triggerId
 */
async function openSettings(teamId, channelId, triggerId) {
  try {
    const {authBlock, authError} = await getAuthBlock(teamId, channelId, triggerId);

    // Do not load settings blocks if Spotify is not authenticated
    const blocks = [
      ...authBlock,
      ...!authError ? await getSettingsBlocks(teamId, channelId ) : [],
    ];

    const modal = slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks, false, channelId);
    await sendModal(triggerId, modal);
  } catch (error) {
    logger.error('Open Settings Failed');
    logger.error(error);
  }
}

/**
 * Loads old config and returns setting blocks
 * @param {string} teamId
 * @param {string} channelId
 */
async function getSettingsBlocks(teamId, channelId ) {
  try {
    const settings = await loadSettings(teamId, channelId );
    return [
      multiSelectUsers(DB.channel_admin, LABELS.channel_admin, HINTS.channel_admin, settings.channel_admin),
      selectExternal(DB.playlist, LABELS.playlist, HINTS.playlist, settings.playlist ? option(settings.playlist.name, settings.playlist.id) : null, QUERY.playlist, PLACE.playlist),
      selectExternal(DB.default_device, LABELS.default_device, HINTS.default_device, settings.default_device ? option(settings.default_device.name, settings.default_device.id) : null, QUERY.default_device, PLACE.default_device),
      textInput(DB.disable_repeats_duration, LABELS.disable_repeats_duration, HINTS.disable_repeats_duration, settings.disable_repeats_duration, LIMITS.disable_repeats_duration, PLACE.disable_repeats_duration),
      selectStatic(DB.back_to_playlist, LABELS.back_to_playlist, HINTS.back_to_playlist, settings.back_to_playlist ? setYesOrNo(settings.back_to_playlist) : null, yesOrNo()),
      selectExternal(DB.timezone, LABELS.timezone, HINTS.timezone, settings.timezone ? option(`${settings.timezone} (${moment().tz(settings.timezone).format('Z')})`, settings.timezone) : null, QUERY.timezone, PLACE.timezone),
      textInput(DB.skip_votes, LABELS.skip_votes, HINTS.skip_votes_ah, settings.skip_votes, LIMITS.skip_votes, PLACE.skip_votes),
      textInput(DB.skip_votes_ah, LABELS.skip_votes_ah, HINTS.skip_votes_ah, settings.skip_votes_ah, LIMITS.skip_votes, PLACE.skip_votes_ah),
    ];
  } catch (error) {
    logger.error('Getting Settings Blocks Failed');
    throw error;
  }
}

/**
 * Save Settings Slack Modal submission
 * @param {string} teamId
 * @param {string} channelId
 * @param {object} view Slack Modal View Object
 * @param {string} userId Slack User Id
 */
async function saveSettings(teamId, channelId, view, userId) {
  try {
    try {
      const submissions = extractSubmissions(view);
      const blocks = extractBlocks(view);
      const errors = verifySettings(submissions, blocks);

      // If Errors we need to return the following object back to Slack.
      if (!isEmpty(errors)) {
        return {
          response_action: 'errors',
          errors: errors,
        };
      }

      // No Errors - proceed with saving the settings
      const settings = await loadSettings(teamId, channelId );
      for (const key in settings) {
        if ({}.hasOwnProperty.call(settings, key)) {
          const oldValue = settings[key];
          let newValue = submissions[key];
          // Some settings need extra values saved alongside the Slack submission payload.
          newValue = await transformValue(teamId, channelId, key, newValue, oldValue);
          // Save on unecessary Read/Writes
          if (isEqual(oldValue, newValue)) {
            delete settings[key];
          } else {
            settings[key] = newValue;
          }
        }
      }

      // Only save if we have something to update.
      if (!isEmpty(settings)) {
        await storeSettings(teamId, channelId, settings);
      }

      // Report back to Slack
      await postEphemeral(
          ephemeralPost(channelId, userId, RESPONSES.settings.success, null),
      );
    } catch (error) {
      logger.error(error);
      // Something in our Save Settings function failed.
      if (channelId) {
        await postEphemeral(
            ephemeralPost(channelId, userId, RESPONSES.settings.fail, null),
        );
      }
    }
  } catch (error) {
    logger.error('Failed to report failiure to Slack');
  }
}

/**
 * Updates our currently open Slack Modal.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} viewId
 * @param {string} triggerId
 */
async function updateView(teamId, channelId, viewId, triggerId) {
  try {
    // If View ID is supplied, this is an authentication request
    // else it is a reauthentication request
    if (!viewId) {
      const view = await loadView(teamId, channelId );
      viewId = view.viewId;
      triggerId = view.triggerId;
    }
    const {authBlock, authError} = await getAuthBlock(teamId, channelId, triggerId);
    // Do not load settings blocks if Spotify is not authenticated
    const blocks = [
      ...authBlock,
      ...!authError ? await getSettingsBlocks(teamId, channelId ) : [],
    ];

    const modal = slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks, false, channelId);
    await updateModal(viewId, modal);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Returns a Yes or No option based on a value
 * @param {string} value
 * @return {option} Yes or No option
 */
function setYesOrNo(value) {
  if (value == `true`) {
    return option(`Yes`, `true`);
  } else {
    return option(`No`, `false`);
  }
}


module.exports = {
  changeAuthentication,
  getAllDevices,
  getAllPlaylists,
  getAllTimezones,
  openSettings,
  saveSettings,
  updateView,
};
