const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();

const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const BLACKLIST_LIMIT = config.dynamodb.blacklist.limit;
const BLACKLIST_MODAL = config.slack.actions.blacklist_modal;
const BLACKLIST_RESPONSE = {
  error: ':warning: Blacklist failed to save.',
  too_many_tracks: 'You have tried to add too many tracks to the blacklist. Please remove some.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, view, userId} = event;
  try {
    // LAMBDA
    const submissions = extractSubmissions(view);
    if (submissions && submissions.length > BLACKLIST_LIMIT) {
      return {
        response_action: 'errors',
        errors: {[BLACKLIST_MODAL]: BLACKLIST_RESPONSE.too_many_tracks},
      };
    }

    const params = {
      Message: JSON.stringify({teamId, channelId, settings, userId, submissions}),
      TopicArn: process.env.SETTINGS_BLACKLIST_SUBMIT_SAVE,
    };
    await sns.publish(params).promise();
  } catch (error) {
    logger.error('Verifying Blacklist Failed');
    logger.error(error);
    try {
      await postEphemeral(
          ephemeralPost(channelId, userId, BLACKLIST_RESPONSE.error, null),
      );
    } catch (error2) {
      logger.error('Failed to report blacklist verify fail');
      logger.error(error);
    }
  }
};

/**
 * Extract the results from the submitted Slack modal view
 * @param {object} view
 * @return {Array} Submission values
 */
function extractSubmissions(view) {
  const values = view.state.values;
  let submissions = [];
  for (const setting in values) {
    if ({}.hasOwnProperty.call(values, setting)) {
      switch (setting) {
        case BLACKLIST_MODAL:
          submissions = values[setting][setting].selected_options;
          break;
      }
    }
  }
  return submissions;
}
