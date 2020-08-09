const logger = require('/opt/utils/util-logger');
const {pushModal, sendModal} = require('/opt/slack/slack-api');
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const RESPONSE = {
  loading: 'Loading...',
  open_failed: 'Opening Slack Modal Failed',
  push_failed: 'Pushing Slack View Failed',
};

const openModal = async (teamId, channelId, triggerId, callback, title, submit, cancel) => {
  const modal = slackModal(callback, title, submit, cancel, [textSection(RESPONSE.loading)], false, channelId);
  return await sendModal(triggerId, modal).catch((error) => {
    logger.error(error, RESPONSE.open_failed);
  });
};

const pushView = async (teamId, channelId, triggerId, callback, title, submit, cancel) => {
  const modal = slackModal(callback, title, submit, cancel, [textSection(RESPONSE.loading)], false, channelId);
  return await pushModal(triggerId, modal).catch((error) => {
    logger.error(error, RESPONSE.push_failed);
  });
};

module.exports = {
  openModal,
  pushView,
};
