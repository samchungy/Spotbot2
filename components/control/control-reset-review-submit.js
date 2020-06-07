const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const sns = require('/opt/sns');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const RESET_MODAL = config.slack.actions.reset_modal;
const REVIEW_JUMP = config.slack.actions.reset_review_jump;
const CONTROL_RESET_SET = process.env.SNS_PREFIX + 'control-reset-set';

const RESET_RESPONSE = {
  failed: 'Reset failed',
  error: ':warning: An error occured.',
};

/**
 * Extract the results from the submitted Slack modal view
 * @param {object} view
 * @return {object} Submission values
 */
const extractSubmissions = (view) => {
  const values = view.state.values;
  const submissions = {};
  for (const item in values) {
    if ({}.hasOwnProperty.call(values, item)) {
      switch (item) {
        case RESET_MODAL:
          if (values[item][item].selected_options) {
            submissions[item] = values[item][item].selected_options.map((option) => option.value);
          }
          break;
        case REVIEW_JUMP:
          submissions[item] = values[item][item].selected_option.value;
          break;
      }
    }
  }
  return submissions;
};

const reviewReset = async (teamId, channelId, settings, view, userId) => {
  // Slack Modal was submitted. Keep whatever tracks were selected
  const {[RESET_MODAL]: trackUris, [REVIEW_JUMP]: jump} = extractSubmissions(view);
  const params = {
    Message: JSON.stringify({teamId, channelId, settings, trackUris, userId, jump: jump === 'true'}),
    TopicArn: CONTROL_RESET_SET,
  };
  await sns.publish(params).promise();
};


module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, view, userId} = JSON.parse(event.Records[0].Sns.Message);
  await reviewReset(teamId, channelId, settings, view, userId)
      .catch((error)=>{
        logger.error(error, RESET_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, RESET_RESPONSE.failed);
      });
};
