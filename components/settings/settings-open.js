const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {sendModal} = require('/opt/slack/slack-api');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const {getAuthBlock} = require('/opt/settings-blocks/settings-auth-blocks');
const {getSettingsBlocks} = require('/opt/settings-blocks/settings-blocks');

const SETTINGS_MODAL = config.slack.actions.settings_modal;

module.exports.handler = async (event, context) => {
  try {
    const {teamId, channelId, triggerId} = JSON.parse(event.Records[0].Sns.Message);
    const {authBlock, authError} = await getAuthBlock(teamId, channelId, triggerId);
    // Do not load settings blocks if Spotify is not authenticated
    const blocks = [
      ...authBlock,
      ...!authError ? await getSettingsBlocks(teamId, channelId ) : [],
    ];

    const modal = slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks, false, channelId);
    await sendModal(triggerId, modal);
  } catch (error) {
    logger.error('Open Settings Failed');
    logger.error(error);
  }
};
