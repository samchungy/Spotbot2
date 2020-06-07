const moment = require(process.env.MOMENT);

// Slack
const {option, optionGroup} = require('/opt/slack/format/slack-format-modal');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const TIMEZONE_RESPONSE = {
  failed: 'Getting timezone data failed',
};

const getTimezones = async (query) => {
  const timezones = moment.tz.names();
  const options = timezones
      .filter((timezone) => timezone.toLowerCase().includes(query.toLowerCase().replace(' ', '_')))
      .map((timezone) => option(`${timezone} (${moment().tz(timezone).format('Z')})`, timezone));

  if (options.length > 100) {
    return {
      option_groups: [optionGroup(`${options.length} queries for "${query}". Displaying 100 of ${options.length}."`, options.slice(0, 100))],
    };
  }

  return {
    option_groups: [optionGroup(`${options.length} queries for "${query}".`, options)],
  };
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, query} = event;
  return await getTimezones(query)
      .catch((error)=>{
        logger.error(error, TIMEZONE_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, TIMEZONE_RESPONSE.failed);
      });
};
