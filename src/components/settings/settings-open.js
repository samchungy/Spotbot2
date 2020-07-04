const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Slack
const {updateModal} = require('/opt/slack/slack-api');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Settings
const {getAuthBlock} = require('./layers/settings-auth-blocks');
const {getSettingsBlocks} = require('./layers/settings-blocks');

const SETTINGS_MODAL = config.slack.actions.settings_modal;

const OPEN_RESPONSE = {
  failed: 'Opening settings failed',
};

const openSettings = async (teamId, channelId, settings, viewId, url) => {
  const {authBlock, authError} = await getAuthBlock(teamId, channelId, viewId, url);
  // Do not load settings blocks if Spotify is not authenticated
  const blocks = [
    ...authBlock,
    ...!authError ? await getSettingsBlocks(settings) : [],
  ];
  const modal = authError ?
    slackModal(SETTINGS_MODAL, `Spotbot Settings`, null, `Close`, blocks, false, channelId) :
    slackModal(SETTINGS_MODAL, `Spotbot Settings`, `Save`, `Cancel`, blocks, false, channelId);
  await updateModal(viewId, modal);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, viewId, userId, url} = JSON.parse(event.Records[0].Sns.Message);
  logger.info({teamId, channelId, settings, viewId, url});
  await openSettings(teamId, channelId, settings, viewId, url)
      .catch((error)=>{
        logger.error(error, OPEN_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, OPEN_RESPONSE.failed);
      });
};
