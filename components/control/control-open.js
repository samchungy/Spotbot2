const logger = require(process.env.LOGGER);
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {responseUpdate} = require('/opt/control-panel/control-panel');

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const auth = await authSession(teamId, channelId);
    return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, null, null);
  } catch (error) {
    logger.error('Control Open failed');
    logger.error(error);
  }
};
