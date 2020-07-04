const logger = require(process.env.LOGGER);
const {pushModal, sendModal} = require('/opt/slack/slack-api');
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {slackModal} = require('/opt/slack/format/slack-format-modal');

/**
 *
 * @param {*} teamId
 * @param {*} channelId
 * @param {*} triggerId
 * @param {*} callback
 * @param {*} title
 * @param {*} submit
 * @param {*} cancel
 */
async function openModal(teamId, channelId, triggerId, callback, title, submit, cancel) {
  try {
    const modal = slackModal(callback, title, submit, cancel, [textSection('Loading...')], false, channelId);
    return await sendModal(triggerId, modal);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 *
 * @param {*} teamId
 * @param {*} channelId
 * @param {*} triggerId
 * @param {*} callback
 * @param {*} title
 * @param {*} submit
 * @param {*} cancel
 */
async function pushView(teamId, channelId, triggerId, callback, title, submit, cancel) {
  try {
    const modal = slackModal(callback, title, submit, cancel, [textSection('Loading...')], false, channelId);
    return await pushModal(modal, triggerId );
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

module.exports = {
  openModal,
  pushView,
};
