const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const SETTINGS_SUBMIT_SAVE = process.env.SNS_PREFIX + 'settings-submit-save';

const DB = config.dynamodb.settings;
const AUTH_URL = config.dynamodb.settings_auth.auth_url;
const AUTH_CONFIRMATION = config.dynamodb.settings_auth.auth_confirmation;
const VERIFY_RESPONSE = {
  integer_error: 'Please enter a valid integer',
  not_authenticated: 'Please authenticate an account with Spotify',
};
const sns = require('/opt/sns');


const {isEmpty, isPositiveInteger} = require('/opt/utils/util-objects');

module.exports.handler = async (event, context) => {
  try {
    // LAMBDA
    const {teamId, channelId, view, userId} = event;
    const submissions = extractSubmissions(view);
    const errors = verifySettings(submissions, view.blocks);

    // If Errors we need to return the following object back to Slack.
    if (!isEmpty(errors)) {
      return {
        response_action: 'errors',
        errors: errors,
      };
    }
    const params = {
      Message: JSON.stringify({teamId: teamId, channelId: channelId, userId: userId, submissions: submissions}),
      TopicArn: SETTINGS_SUBMIT_SAVE,
    };
    await sns.publish(params).promise();
  } catch (error) {
    logger.error('Update View Failed');
    logger.error(error);
  }
};


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
        case DB.channel_admins:
          submissions[setting] = values[setting][setting].selected_users;
          break;
        case DB.playlist:
        case DB.default_device:
        case DB.back_to_playlist:
        case DB.ghost_mode:
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
            errors[setting] = VERIFY_RESPONSE.integer_error;
          }
          break;
      }
    }
  }
  // Check for Authentication
  if (blocks.length === 1 || blocks[1].block_id !== AUTH_CONFIRMATION) {
    errors[AUTH_URL] = VERIFY_RESPONSE.not_authenticated;
  }
  return errors;
}
