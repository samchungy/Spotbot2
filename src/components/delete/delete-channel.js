const logger = require('/opt/utils/util-logger');

const {removeAllSettings, searchAllSettings} = require('/opt/db/settings-interface');
const {removeAuth} = require('/opt/db/spotify-auth-interface');

const RESPONSE = {
  failed: 'Deleting channel settings failed',
};

const main = async (teamId, channelId) => {
  const allSettings = await searchAllSettings(teamId, channelId);
  if (allSettings.length) {
    await Promise.all([
      removeAuth(teamId, channelId),
      removeAllSettings(teamId, channelId, allSettings.map((setting) => setting.name)),
    ]);
  }
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;

