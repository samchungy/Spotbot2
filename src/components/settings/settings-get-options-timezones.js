'use strict';
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');
const logger = require('/opt/utils/util-logger');

// Slack
const {option, optionGroup} = require('/opt/slack/format/slack-format-modal');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const RESPONSE = {
  failed: 'Getting timezone data failed',
};
const OPTION = {
  resultsHundred: (total, query) => `${total} queries for "${query}". Displaying 100 of ${total}."`,
  results: (total, query) => `${total} ${total === 1 ? 'query' : 'queries'} for "${query}".`,
  timezone: (name, offset) => `${name} (${offset})`,
};

const main = async (query) => {
  const timezones = moment.tz.names();
  const options = timezones
      .filter((timezone) => timezone.toLowerCase().includes(query.toLowerCase().replace(' ', '_')))
      .map((timezone) => option(OPTION.timezone(timezone, moment().tz(timezone).format('Z')), timezone));

  if (options.length > 100) {
    return {
      option_groups: [optionGroup(OPTION.resultsHundred(options.length, query), options.slice(0, 100))],
    };
  }

  return {
    option_groups: [optionGroup(OPTION.results(options.length, query), options)],
  };
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, query} = event;
  return await main(query)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, RESPONSE.failed);
      });
};
module.exports.OPTION = OPTION;
module.exports.RESPONSE = RESPONSE;
