const config = require('config');
const REVIEW = config.get('slack.actions.reset_review');
const REVIEW_JUMP = config.get('slack.actions.reset_review_jump');

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
        case REVIEW:
          submissions[item] = values[item][item].selected_options.map((option) => option.value);
          break;
        case REVIEW_JUMP:
          submissions[item] = values[item][item].selected_option.value;
          break;
      }
    }
  }
  return submissions;
}

module.exports = {
  extractSubmissions,
};
