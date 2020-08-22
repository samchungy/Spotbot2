const logger = require('/opt/utils/util-logger');

// Tracks
const {showResults} = require('./layers/get-artists');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const RESPONSE = {
  failed: 'Fetching more search results failed',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, triggerId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  await showResults(teamId, channelId, userId, triggerId, responseUrl)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
