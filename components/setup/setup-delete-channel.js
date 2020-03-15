const logger = require(process.env.LOGGER);

const {deleteSettings, searchAllSettings} = require('/opt/settings/settings-interface');
const {allSettingsKeyExpression, allSettingsValues} = require('/opt/settings/settings-model');
const {removeSpotifyAuth} = require('/opt/spotify/spotify-auth/spotify-auth-interface');

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings} = JSON.parse(event.Records[0].Sns.Message);
  try {
    if (settings) {
      // All other tables have ttl, we can just let them expire.
      const allSettings = await searchAllSettings(allSettingsKeyExpression, allSettingsValues(teamId, channelId));
      if (allSettings.length) {
        await Promise.all([
          removeSpotifyAuth(teamId, channelId),
          deleteSettings(teamId, channelId, allSettings.map((setting) => setting.name)),
        ]);
      }
    }
  } catch (error) {
    logger.error(`Deleting ${teamId} ${channelId} channel failed`);
    logger.error(error);
  }
};
