const moment = require('moment-timezone');
const {option, optionGroup} = require('../slack/format/slack-format-modal');

/**
 * Returns all timezones containing the search query
 * @param {String} query
 * @return {Array} Array of timezones
 */
function getAllTimezones(query) {
  console.log(query);
  const timezones = moment.tz.names();
  const options = timezones
      .filter((timezone) => timezone.toLowerCase().includes(query.toLowerCase().replace(' ', '_')))
      .map((timezone) => option(timezone, timezone));

  if (options.length > 100) {
    return {
      option_groups: [optionGroup(`${options.length} queries for "${query}". Displaying 100 of ${options.length}."`, options.slice(0, 100))],
    };
  }

  return {
    option_groups: [optionGroup(`${options.length} queries for "${query}".`, options)],
  };
}

module.exports = {
  getAllTimezones,
};
