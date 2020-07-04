const logger = require(process.env.LOGGER);

const {removeAllSettings, searchAllSettings} = require('/opt/db/settings-interface');
const {removeAuth} = require('/opt/db/spotify-auth-interface');

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings} = JSON.parse(event.Records[0].Sns.Message);
  try {
    if (settings) {
      // All other tables have ttl, we can just let them expire.
      const allSettings = await searchAllSettings(teamId, channelId);
      if (allSettings.length) {
        await Promise.all([
          removeAuth(teamId, channelId),
          removeAllSettings(teamId, channelId, allSettings.map((setting) => setting.name)),
        ]);
      }
    }
  } catch (error) {
    logger.error(`Deleting ${teamId} ${channelId} channel failed`);
    logger.error(error);
  }
};
