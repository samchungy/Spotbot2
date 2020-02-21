const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);

const {loadSettings} = require('/opt/settings/settings-interface');
const {updateModal} = require('/opt/slack/slack-api');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const {getAuthBlock} = require('/opt/settings-blocks/settings-auth-blocks');
const {getSettingsBlocks} = require('/opt/settings-blocks/settings-blocks');

const SETTINGS_MODAL = config.slack.actions.settings_modal;

module.exports.handler = async (event, context) => {
  try {
    const {teamId, channelId, viewId} = JSON.parse(event.Records[0].Sns.Message);
    const settings = await loadSettings(teamId, channelId);
    const {authBlock, authError} = await getAuthBlock(teamId, channelId, viewId);
    // Do not load settings blocks if Spotify is not authenticated
    const blocks = [
      ...authBlock,
      ...!authError ? await getSettingsBlocks(settings) : [],
    ];

    const modal = slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks, false, channelId);
    await updateModal(viewId, modal);
  } catch (error) {
    logger.error('Update View Failed');
    logger.error(error);
  }
};
