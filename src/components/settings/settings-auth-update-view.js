const logger = require('/opt/utils/util-logger');
const config = require('/opt/config/config');

// Slack
const {updateModal} = require('/opt/slack/slack-api');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Settings
const {loadSettings} = require('/opt/db/settings-interface');
const {getAuthBlock} = require('./layers/settings-auth-blocks');
const {getSettingsBlocks} = require('./layers/settings-blocks');

const SETTINGS_MODAL = config.slack.actions.settings_modal;

const RESPONSE = {
  failed: 'Updating the settings panel failed',
};

const main = async (teamId, channelId, viewId, url) => {
  const settings = await loadSettings(teamId, channelId);
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
  const {teamId, channelId, viewId, url} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, viewId, url)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, RESPONSE.failed);
      });
};
