const sns = require('/opt/sns');


const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const CONTROL_RESET_SET = process.env.SNS_PREFIX + 'control-reset-set';

const RESET_MODAL = config.slack.actions.reset_modal;
const REVIEW_JUMP = config.slack.actions.reset_review_jump;

const RESET_RESPONSE = {
  error: ':warning: An error occured.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, timestamp, view, isClose, userId} = JSON.parse(event.Records[0].Sns.Message);
  try {
    if (isClose) {
      // Slack Modal was closed. Keep no tracks
      const params = {
        Message: JSON.stringify({teamId, channelId, settings, timestamp, trackUris: null, userId}),
        TopicArn: CONTROL_RESET_SET,
      };
      await sns.publish(params).promise();
    } else {
      // Slack Modal was submitted. Keep whatever tracks were selected
      const {[RESET_MODAL]: trackUris, [REVIEW_JUMP]: jump} = extractSubmissions(view);
      const params = {
        Message: JSON.stringify({teamId, channelId, settings, timestamp, trackUris, userId, jump: (jump == 'true')}),
        TopicArn: CONTROL_RESET_SET,
      };
      await sns.publish(params).promise();
    }
  } catch (error) {
    logger.error(error);
    return {success: false, response: RESET_RESPONSE.error, status: null};
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
}
