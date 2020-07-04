const sns = require('/opt/sns');
const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const SETTINGS_BLACKLIST_SUBMIT_SAVE = process.env.SNS_PREFIX + 'settings-blacklist-submit-save';

const BLACKLIST_LIMIT = config.dynamodb.blacklist.limit;
const BLACKLIST_MODAL = config.slack.actions.blacklist_modal;
const BLACKLIST_RESPONSE = {
  failed: 'Submitting blacklist failed',
  error: ':warning: Blacklist failed to save.',
  too_many_tracks: 'You have tried to add too many tracks to the blacklist. Please remove some.',
};

const extractSubmissions = (view) => {
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
};

const startVerification = async (teamId, channelId, settings, view, userId) => {
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
    TopicArn: SETTINGS_BLACKLIST_SUBMIT_SAVE,
  };
  await sns.publish(params).promise();
  return null;
};


module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, view, userId} = event;
  return await startVerification(teamId, channelId, settings, view, userId)
      .catch((error)=>{
        logger.error(error, BLACKLIST_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, BLACKLIST_RESPONSE.failed);
      });
};
