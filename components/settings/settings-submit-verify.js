const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const sns = require('/opt/sns');

// Util
const {isEmpty, isPositiveInteger} = require('/opt/utils/util-objects');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const SETTINGS_SUBMIT_SAVE = process.env.SNS_PREFIX + 'settings-submit-save';
const DB = config.dynamodb.settings;
const VERIFY_RESPONSE = {
  failed: 'Settings verification failed',
  integer_error: 'Please enter a valid integer',
};

/**
 * Extract the results from the submitted Slack modal view
 * @param {object} view
 * @return {object} Submission values
 */
const extractSubmissions = (view) => {
  const values = view.state.values;
  const submissions = Object.keys(values).reduce((acc, setting) => {
    switch (setting) {
      case DB.channel_admins:
        acc[setting] = values[setting][setting].selected_users;
        break;
      case DB.playlist:
      case DB.default_device:
      case DB.back_to_playlist:
      case DB.ghost_mode:
      case DB.timezone:
        acc[setting] = values[setting][setting].selected_option.value;
        break;
      case DB.disable_repeats_duration:
      case DB.skip_votes:
      case DB.skip_votes_ah:
        acc[setting] = values[setting][setting].value;
        break;
    }
    return acc;
  }, {});
  return submissions;
};

/**
 * Verify Submission
 * @param {object} submission
 * @return {array} Array of Slack Errors
 */
const verifySettings = (submission) => {
  const errors = Object.keys(submission).reduce((errs, setting) => {
    const value = submission[setting];
    switch (setting) {
      // Our Integer Fields
      case DB.disable_repeats_duration:
      case DB.skip_votes:
      case DB.skip_votes_ah:
        if (!isPositiveInteger(value)) {
          errs[setting] = VERIFY_RESPONSE.integer_error;
        }
        break;
    }
    return errs;
  }, {});
  return errors;
};

const startVerification = async (teamId, channelId, view, userId) => {
  // LAMBDA
  const submissions = extractSubmissions(view);
  const errors = verifySettings(submissions);

  // If Errors we need to return the following object back to Slack.
  if (!isEmpty(errors)) {
    return {
      response_action: 'errors',
      errors: errors,
    };
  }
  const params = {
    Message: JSON.stringify({teamId, channelId, userId, submissions}),
    TopicArn: SETTINGS_SUBMIT_SAVE,
  };
  await sns.publish(params).promise();
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, view, userId} = event;
  return await startVerification(teamId, channelId, view, userId)
      .catch((error)=>{
        logger.error(error, VERIFY_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, VERIFY_RESPONSE.failed);
      });
};
