const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);

const {loadView} = require('/opt/spotify/spotify-auth/spotifyauth-dal');
const {updateModal} = require('/opt/slack/slack-api');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const {getAuthBlock} = require('/opt/spotify/spotify-auth/spotifyauth-controller');
const {getSettingsBlocks} = require('/opt/settings-blocks/settings-blocks');

const SETTINGS_MODAL = config.slack.actions.settings_modal;

module.exports.handler = async (event, context) => {
  try {
    const {teamId, channelId, triggerId, viewId} = JSON.parse(event.Records[0].Sns.Message);
    // If View ID is supplied, this is an authentication request
    // else it is a reauthentication request
    if (!viewId) {
      const view = await loadView(teamId, channelId );
      viewId = view.viewId;
      triggerId = view.triggerId;
    }
    const {authBlock, authError} = await getAuthBlock(teamId, channelId, triggerId);
    // Do not load settings blocks if Spotify is not authenticated
    const blocks = [
      ...authBlock,
      ...!authError ? await getSettingsBlocks(teamId, channelId ) : [],
    ];

    const modal = slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks, false, channelId);
    await updateModal(viewId, modal);
  } catch (error) {
    logger.error('Update View Failed');
    logger.error(error);
  }
};
