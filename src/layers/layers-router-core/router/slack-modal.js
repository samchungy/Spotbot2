const {pushModal, sendModal} = require('/opt/slack/slack-api');
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const RESPONSE = {
  loading: 'Loading...',
};

const openModal = async (teamId, channelId, triggerId, callbackId, title, submit, cancel) => {
  const modal = slackModal(callbackId, title, submit, cancel, [textSection(RESPONSE.loading)], false, channelId);
  return await sendModal(triggerId, modal);
};

const pushView = async (teamId, channelId, triggerId, callbackId, title, submit, cancel) => {
  const modal = slackModal(callbackId, title, submit, cancel, [textSection(RESPONSE.loading)], false, channelId);
  return await pushModal(triggerId, modal);
};

module.exports = {
  openModal,
  pushView,
  RESPONSE,
};
