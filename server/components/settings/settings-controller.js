const config = require('config');
const logger = require('../../util/util-logger');
const {option, slackModal, selectChannels, selectExternal, selectStatic, textInput} = require('../slack/format/slack-format-modal');
const {sendModal, updateModal} = require('../slack/slack-api');

const {getAuthBlock, resetAuthentication} = require('./spotifyauth/spotifyauth-controller');
const {getAllPlaylists} = require('./settings-playlists');
const {getAllDevices} = require('./settings-device');
const {getAllTimezones} = require('./settings-timezones');
const {transformValue} = require('./settings-transform');
const {extractBlocks, extractSubmissions, verifySettings} = require('./settings-verify');

const {loadSettings, loadView, storeDeviceSetting, storePlaylistSetting, storeSettings, storeView} = require('./settings-dal');
const {modelView} = require('./settings-model');

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
const CHANNEL = config.get('dynamodb.settings.slack_channel');

/**
 * Resets the authentication
 * @param {string} viewId
 * @param {string} triggerId
 */
async function changeAuthentication() {
  try {
    await resetAuthentication();
    await Promise.all([
      storeDeviceSetting(null),
      storePlaylistSetting(null),
    ]);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Open the Spotbot Settings Panel via Slack Modal.
 * @param {string} triggerId
 */
async function openSettings(triggerId) {
  try {
    const {authBlock, authError} = await getAuthBlock(triggerId);

    // Do not load settings blocks if Spotify is not authenticated
    const blocks = [
      ...authBlock,
      ...!authError ? await getSettingsBlocks() : [],
    ];

    const modal = slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks);
    await sendModal(triggerId, modal);
  } catch (error) {
    logger.error('Open Settings Failed');
    logger.error(error);
  }
}

/**
 * Loads old config and returns setting blocks
 */
async function getSettingsBlocks() {
  try {
    const settings = await loadSettings();
    return [
      selectChannels(DB.slack_channel, LABELS.slack_channel, HINTS.slack_channel, settings.slack_channel),
      selectExternal(DB.playlist, LABELS.playlist, HINTS.playlist, settings.playlist ? option(settings.playlist.name, settings.playlist.id) : null, QUERY.playlist, PLACE.playlist),
      selectExternal(DB.default_device, LABELS.default_device, HINTS.default_device, settings.default_device ? option(settings.default_device.name, settings.default_device.id) : null, QUERY.default_device, PLACE.default_device),
      textInput(DB.disable_repeats_duration, LABELS.disable_repeats_duration, HINTS.disable_repeats_duration, settings.disable_repeats_duration, LIMITS.disable_repeats_duration, PLACE.disable_repeats_duration),
      selectStatic(DB.back_to_playlist, LABELS.back_to_playlist, HINTS.back_to_playlist, settings.back_to_playlist ? setYesOrNo(settings.back_to_playlist) : null, yesOrNo()),
      selectExternal(DB.timezone, LABELS.timezone, HINTS.timezone, settings.timezone ? option(settings.timezone, settings.timezone) : null, QUERY.timezone, PLACE.timezone),
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
 * @param {object} view Slack Modal View Object
 * @param {string} userId Slack User Id
 */
async function saveSettings(view, userId) {
  try {
    // Channel for Status Reporting
    let channel;
    try {
      const submissions = extractSubmissions(view);
      channel = submissions[CHANNEL];
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
      const settings = await loadSettings();
      for (const key in settings) {
        if ({}.hasOwnProperty.call(settings, key)) {
          const oldValue = settings[key];
          let newValue = submissions[key];
          // Some settings need extra values saved alongside the Slack submission payload.
          newValue = await transformValue(key, newValue, oldValue);
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
        await storeSettings(settings);
      }

      // Report back to Slack
      await postEphemeral(
          ephemeralPost(channel, userId, RESPONSES.settings.success, null),
      );
    } catch (error) {
      logger.error(error);
      // Something in our Save Settings function failed.
      if (channel) {
        await postEphemeral(
            ephemeralPost(channel, userId, RESPONSES.settings.fail, null),
        );
      }
    }
  } catch (error) {
    logger.error('Failed to report failiure to Slack');
  }
}

/**
 * Updates our currently open Slack Modal.
 * @param {string} failReason
 * @param {string} viewId
 * @param {string} triggerId
 */
async function updateView(failReason, viewId, triggerId) {
  try {
    // If View ID is supplied, this is an authentication request
    // else it is a reauthentication request
    if (!viewId) {
      const view = await loadView();
      viewId = view.viewId;
      triggerId = view.triggerId;
    }
    const {authBlock, authError} = await getAuthBlock(triggerId, failReason);
    // Do not load settings blocks if Spotify is not authenticated
    const blocks = [
      ...authBlock,
      ...!authError ? await getSettingsBlocks() : [],
    ];

    const modal = slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks);
    await updateModal(viewId, modal);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Save the ViewId from our Authentication attempt
 * @param {string} viewId
 * @param {string} triggerId
 */
async function saveView(viewId, triggerId) {
  const store = modelView(viewId, triggerId);
  storeView(store);
}

/**
 * Generates a yes or no option array
 * @return {array} Yes or No options
 */
function yesOrNo() {
  return [
    option(`Yes`, `true`),
    option(`No`, `false`),
  ];
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
  saveView,
  updateView,
};
