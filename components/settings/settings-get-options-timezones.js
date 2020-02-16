const moment = require(process.env.MOMENT);
const {option, optionGroup} = require('/opt/slack/format/slack-format-modal');

/**
 * Return device devices for the settings panel.
 * @param {Object} event
 * @param {Object} context
 */
module.exports.handler = async (event, context) => {
  try {
    // LAMBDA FUNCTION
    const {query} = event;

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
  } catch (error) {
    logger.error('Getting timezones failed');
    throw error;
  }
};
