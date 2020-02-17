const logger = require(process.env.LOGGER);
const {sendModal} = require('/opt/slack/slack-api');
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
  }
}

module.exports = {
  openModal,
};
