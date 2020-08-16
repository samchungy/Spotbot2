const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const sns = require('/opt/sns');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const RESET_MODAL = config.slack.actions.reset_modal;
const REVIEW_JUMP = config.slack.actions.reset_review_jump;
const CONTROL_RESET_SET = process.env.SNS_PREFIX + 'control-reset-set';

const RESPONSE = {
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
  const submissions = Object.entries(values).reduce((subs, [key, value]) => {
    switch (key) {
      case RESET_MODAL:
        if (value[key].selected_options) {
          subs[key] = value[key].selected_options.map((option) => option.value);
        }
        break;
      case REVIEW_JUMP:
        subs[key] = value[key].selected_option.value;
        break;
    }
    return subs;
  }, {});
  return submissions;
};

const main = async (teamId, channelId, settings, view, userId) => {
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
  await main(teamId, channelId, settings, view, userId)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
