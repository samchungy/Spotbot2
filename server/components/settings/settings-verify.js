const config = require('config');
const {isPositiveInteger} = require('../../util/util-objects');
const DB = config.get('dynamodb.settings');
const AUTH_URL = config.get('dynamodb.settings_auth.auth_url');
const AUTH_CONFIRMATION = config.get('dynamodb.settings_auth.auth_confirmation');
const ERRORS = config.get('settings.errors');


/**
 * Extract the results from the submitted Slack modal view
 * @param {object} view
 * @return {object} Submission values
 */
function extractSubmissions(view) {
  const values = view.state.values;
  const submissions = {};
  for (const setting in values) {
    if ({}.hasOwnProperty.call(values, setting)) {
      switch (setting) {
        case DB.slack_channel:
          submissions[setting] = values[setting][setting].selected_channel;
          break;
        case DB.playlist:
        case DB.default_device:
        case DB.back_to_playlist:
        case DB.timezone:
          submissions[setting] = values[setting][setting].selected_option.value;
          break;
        case DB.disable_repeats_duration:
        case DB.skip_votes:
        case DB.skip_votes_ah:
          submissions[setting] = values[setting][setting].value;
          break;
      }
    }
  }
  return submissions;
}

/**
 * Extract blocks from View
 * @param {object} view
 * @return {array} Slack Blocks
 */
function extractBlocks(view) {
  return view.blocks;
}

/**
 * Verify Submission
 * @param {object} submission
 * @param {object} blocks
 * @return {array} Array of Slack Errors
 */
function verifySettings(submission, blocks) {
  const errors = {};
  // Check submission values
  for (const setting in submission) {
    if ({}.hasOwnProperty.call(submission, setting)) {
      const value = submission[setting];
      switch (setting) {
        // Our Integer Fields
        case DB.disable_repeats_duration:
        case DB.skip_votes:
        case DB.skip_votes_ah:
          if (!isPositiveInteger(value)) {
            errors[setting] = ERRORS.integer;
          }
          break;
      }
    }
  }
  // Check for Authentication
  if (blocks.length === 1 || blocks[1].block_id !== AUTH_CONFIRMATION) {
    errors[AUTH_URL] = ERRORS.not_authenticated;
  }
  return errors;
}

module.exports = {
  extractBlocks,
  extractSubmissions,
  verifySettings,
};
