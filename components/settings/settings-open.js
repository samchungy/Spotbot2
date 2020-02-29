const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {postEphemeral, updateModal} = require('/opt/slack/slack-api');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {getAuthBlock} = require('/opt/settings-blocks/settings-auth-blocks');
const {getSettingsBlocks} = require('/opt/settings-blocks/settings-blocks');

const SETTINGS_MODAL = config.slack.actions.settings_modal;

const OPEN_RESPONSE = {
  fail: ':x: Something went wrong! Could not open Settings. Please try again.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, viewId, userId, url} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const {authBlock, authError} = await getAuthBlock(teamId, channelId, viewId, url);
    // Do not load settings blocks if Spotify is not authenticated
    const blocks = [
      ...authBlock,
      ...!authError ? await getSettingsBlocks(settings) : [],
    ];
    const modal = slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks, false, channelId);
    await updateModal(viewId, modal);
  } catch (error) {
    logger.error('Open Settings Failed');
    logger.error(error);
    try {
      await postEphemeral(
          ephemeralPost(channelId, userId, OPEN_RESPONSE.fail, null),
      );
    } catch (error) {
      logger.error('Failed to report open settings failed');
      logger.error(error);
    }
  }
};
