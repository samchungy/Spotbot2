const logger = require('../../util/util-logger');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {getCurrentTrackPanel, getShuffleRepeatPanel, getControlsPanel} = require('./control-panel');
const {inChannelReply, updateReply, inChannelPost} = require('../slack/format/slack-format-reply');
const {post, reply} = require('../slack/slack-api');
const {setPlay} = require('./control-play');
const {setPause} = require('./control-pause');

/**
 * Opens a menu of Spotbot controls
 * @param {string} responseUrl
 */
async function openControls(responseUrl) {
  try {
    try {
      const status = await fetchCurrentPlayback();
      const {altText, currentPanel} = getCurrentTrackPanel(status);

      const controlPanel = [
        ...currentPanel,
        ...getShuffleRepeatPanel(status) ? [getShuffleRepeatPanel(status)] : [],
        getControlsPanel(),
      ];

      await reply(
          inChannelReply(altText, controlPanel),
          responseUrl,
      );
    } catch (error) {
      console.error(error);
      logger.error('Yeet');
    }
  } catch (error) {
    logger.error('Failed to report failiure to Slack');
  }
}


/**
 * Update the control panel
 * @param {string} responseUrl
 * @param {string} response
 * @param {Object} status
 */
async function updatePanel(responseUrl, response, status) {
  try {
    if (!status) {
      status = await fetchCurrentPlayback();
    }
    console.log(status);
    const {altText, currentPanel} = getCurrentTrackPanel(status, response);

    const controlPanel = [
      ...currentPanel,
      ...getShuffleRepeatPanel(status) ? [getShuffleRepeatPanel(status)] : [],
      getControlsPanel(),
    ];

    await reply(
        updateReply(altText, controlPanel),
        responseUrl,
    );
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Hits Play on Spotify
 * @param {string} responseUrl
 * @param {string} channelId
 */
async function play(responseUrl, channelId) {
  try {
    const {success, response, status} = await setPlay();
    if (!success) {
      await updatePanel(responseUrl, response, status);
    } else {
      updatePanel(responseUrl, null, status);
      post(
          inChannelPost(channelId, response, null),
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Hits pause on Spotify
 * @param {string} responseUrl
 * @param {string} channelId
 * @param {string} userId
 */
async function pause(responseUrl, channelId, userId) {
  try {
    const {success, response, status} = await setPause(userId);
    if (!success) {
      await updatePanel(responseUrl, response, status);
    } else {
      updatePanel(responseUrl, null, status);
      post(
          inChannelPost(channelId, response, null),
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

module.exports = {
  openControls,
  pause,
  play,
};
