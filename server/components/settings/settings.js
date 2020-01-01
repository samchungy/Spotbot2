const config = require('config');
const logger = require('../../util/logger');
// const { option, selectDialogElement, selectSlackDialogElement, selectDynamicSlackDialogElement, slackDialog, textDialogElement } = require('../slack/format/dialog');
const {option, slackModal, selectChannels, selectExternal, selectStatic, textInput} = require('../slack/format/modal');
const {getAllPlaylists} = require('./playlists');
const {getAllDevices} = require('./devices');
const {transformValue} = require('./transform');
const {sendModal, updateModal} = require('../slack/api');
const {loadSettings, loadView, storeDeviceSetting, storePlaylistSetting, storeSettings, storeView} = require('./settingsDAL');
const {modelView} = require('./settingsModel');
const {isEqual, isEmpty} = require('../../util/objects');
const {extractBlocks, extractSubmissions, verifySettings} = require('./verify');
const {getAuthBlock, resetAuthentication} = require('./spotifyAuth/spotifyAuth');

const HINTS = config.get('settings.hints');
const LABELS = config.get('settings.labels');
const QUERY = config.get('settings.query_lengths');
const LIMITS = config.get('settings.limits');
const PLACE = config.get('settings.placeholders');
const SETTINGS_MODAL = config.get('slack.actions.settings_modal');
const DB = config.get('dynamodb.settings');

/**
 * Reset our authentication
 */
async function changeAuthentication() {
  await resetAuthentication();
  storeDeviceSetting(null);
  storePlaylistSetting(null);
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
      selectExternal(DB.playlist, LABELS.playlist, HINTS.playlist, settings.playlist ? option(settings.playlist.name, settings.playlist.id) : null, QUERY.playlist),
      selectExternal(DB.default_device, LABELS.default_device, HINTS.default_device, settings.default_device ? option(settings.default_device.name, settings.default_device.id) : null, QUERY.default_device),
      textInput(DB.disable_repeats_duration, LABELS.disable_repeats_duration, HINTS.disable_repeats_duration, settings.disable_repeats_duration, LIMITS.disable_repeats_duration, PLACE.disable_repeats_duration),
      selectStatic(DB.back_to_playlist, LABELS.back_to_playlist, HINTS.back_to_playlist, settings.back_to_playlist ? setYesOrNo(settings.back_to_playlist) : null, yesOrNo()),
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
 * @param {string} responseUrl Slack response url
 */
async function saveSettings(view, responseUrl) {
  try {
    const submissions = extractSubmissions(view);
    const blocks = extractBlocks(view);
    const errors = verifySettings(submissions, blocks);
    if (!isEmpty(errors)) {
      return {
        response_action: 'errors',
        errors: errors,
      };
    }
    const settings = await loadSettings();
    for (const key in settings) {
      if ({}.hasOwnProperty.call(settings, key)) {
        const oldValue = settings[key];
        let newValue = submissions[key];
        newValue = await transformValue(key, newValue, oldValue);

        // Save on unecessary Read/Writes
        if (isEqual(oldValue, newValue)) {
          delete settings[key];
        } else {
          settings[key] = newValue;
        }
      }
    }
    // TODO: Respond via responseUrl
    if (!isEmpty(settings)) {
      await storeSettings(settings);
    }
  } catch (error) {
    logger.error(error);
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
    throw error;
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
  openSettings,
  saveSettings,
  saveView,
  updateView,
};
