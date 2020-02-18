const logger = require(process.env.LOGGER);
const {responseUpdate} = require('/opt/control-panel/control-panel');

module.exports.handler = async (event, context) => {
  const {teamId, channelId, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    return await responseUpdate(teamId, channelId, timestamp, false, null, null);
  } catch (error) {
    logger.error('Control Open failed');
    logger.error(error);
  }
};
