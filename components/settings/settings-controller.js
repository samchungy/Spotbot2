const config = require('config');
const logger = require('../../../layers/config/util-logger');
const {slackModal} = require('../slack/format/slack-format-modal');
const {sendModal, updateModal} = require('../slack/slack-api');
const {getAuthBlock} = require('./spotifyauth/spotifyauth-controller');
const {loadView} = require('./layers/layers-spotify-auth/spotify-auth/spotifyauth-dal');
const {getSettingsBlocks} = require('./layers/layers-settings/settings-blocks/settings-block');
const {getAllPlaylists} = require('./settings-playlists');
const {getAllDevices} = require('./settings-device');
const {getAllTimezones} = require('./settings-timezones');
const {transformValue} = require('./settings-transform');
const {extractBlocks, extractSubmissions, verifySettings} = require('./settings-verify');

const {loadSettings, storeSettings} = require('./layers/layers-settings-dal/settings-dal/settings-dal');

const {ephemeralPost} = require('../slack/format/slack-format-reply');
const {postEphemeral} = require('../slack/slack-api');

const {isEqual, isEmpty} = require('../../../layers/configs-utils/util-objects');

const SETTINGS_MODAL = config.get('slack.actions.settings_modal');

const SETTINGS_RESPONSE = {
  success: ':white_check_mark: Settings successfully saved.',
  fail: ':x: Something went wrong! Settings were not saved.',
};

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
          ephemeralPost(channelId, userId, SETTINGS_RESPONSE.success, null),
      );
    } catch (error) {
      logger.error(error);
      // Something in our Save Settings function failed.
      if (channelId) {
        await postEphemeral(
            ephemeralPost(channelId, userId, SETTINGS_RESPONSE.fail, null),
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


module.exports = {
  getAllDevices,
  getAllPlaylists,
  getAllTimezones,
  openSettings,
  saveSettings,
  updateView,
};
