const sns = require('/opt/sns');
const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const SETTINGS_BLACKLIST_SUBMIT_SAVE = process.env.SNS_PREFIX + 'settings-blacklist-submit-save';

const BLACKLIST_LIMIT = config.dynamodb.blacklist.limit;
const BLACKLIST_MODAL = config.slack.actions.blacklist_modal;
const RESPONSE = {
  failed: 'Submitting blacklist failed',
  error: ':warning: Blacklist failed to save.',
  too_many_tracks: 'You have tried to add too many tracks to the blacklist. Please remove some.',
};

const extractSubmissions = (view) => {
  const values = view.state.values;
  return Object.entries(values).reduce((subs, [key, value]) => {
    switch (key) {
      case BLACKLIST_MODAL:
        subs = value[key].selected_options;
        break;
    }
    return subs;
  }, []) || [];
};

const main = async (teamId, channelId, settings, view, userId) => {
  // LAMBDA
  const submissions = extractSubmissions(view);
  if (submissions && submissions.length > BLACKLIST_LIMIT) {
    return {
      response_action: 'errors',
      errors: {[BLACKLIST_MODAL]: RESPONSE.too_many_tracks},
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
  return await main(teamId, channelId, settings, view, userId)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
