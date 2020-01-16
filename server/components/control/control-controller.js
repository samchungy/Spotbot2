const logger = require('../../util/util-logger');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {getCurrentTrackPanel, getShuffleRepeatPanel, getControlsPanel} = require('./control-panel');
const {inChannelReply, updateReply, inChannelPost} = require('../slack/format/slack-format-reply');
const {post, reply} = require('../slack/slack-api');
const {setPlay} = require('./control-play');
const {setPause} = require('./control-pause');
const {startSkipVote, addVote} = require('./contol-skip');
const {setRepeat, setShuffle} = require('./control-shuffle-repeat');
const {setJumpToStart} = require('./control-jump');

/**
 * Opens a menu of Spotbot controls
 * @param {string} responseUrl
 */
async function openControls(responseUrl) {
  try {
    try {
      const status = await fetchCurrentPlayback();
      const {altText, currentPanel} = await getCurrentTrackPanel(status);

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
    const {altText, currentPanel} = await getCurrentTrackPanel(status, response);

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
    throw error;
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
      await Promise.all([
        updatePanel(responseUrl, null, status),
        post(
            inChannelPost(channelId, response, null),
        ),
      ]);
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
      await Promise.all([
        updatePanel(responseUrl, null, status),
        post(
            inChannelPost(channelId, response, null),
        ),
      ]);
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Hits pause on Spotify
 * @param {string} timestamp
 * @param {string} channelId
 * @param {string} userId
 */
async function skip(timestamp, channelId, userId) {
  try {
    const {response, status} = await startSkipVote(channelId, userId);
    await updatePanel(timestamp, channelId, response, status);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Add vote to skip
 * @param {string} channelId
 * @param {string} userId
 * @param {string} value
 * @param {string} responseUrl
 */
async function voteToSkip(channelId, userId, value, responseUrl) {
  try {
    await addVoteFromPost(channelId, userId, value, responseUrl);
  } catch (error) {
    logger.error('Vote failed');
  }
}

/**
 * Toggles shuffle on Spotify
 * @param {String} responseUrl
 * @param {String} channelId
 * @param {String} userId
 */
async function toggleShuffle(responseUrl, channelId, userId) {
  try {
    const {success, response, status} = await setShuffle(userId);
    if (!success) {
      await updatePanel(responseUrl, response, status);
    } else {
      await Promise.all([
        updatePanel(responseUrl, null, status),
        post(
            inChannelPost(channelId, response, null),
        ),
      ]);
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Toggles repeat on Spotify
 * @param {String} responseUrl
 * @param {String} channelId
 * @param {String} userId
 */
async function toggleRepeat(responseUrl, channelId, userId) {
  try {
    const {success, response, status} = await setRepeat(userId);
    if (!success) {
      await updatePanel(responseUrl, response, status);
    } else {
      await Promise.all([
        updatePanel(responseUrl, null, status),
        post(
            inChannelPost(channelId, response, null),
        ),
      ]);
    }
  } catch (error) {
    logger.error(error);
  }
}


/**
 * Jumps to start of playlist on Spotify
 * @param {String} timestamp
 * @param {String} channelId
 * @param {String} userId
 */
async function jumpToStart(timestamp, channelId, userId) {
  try {
    const {success, response, status} = await setJumpToStart(userId);
    if (!success) {
      await updatePanel(timestamp, channelId, response, status);
    } else {
      await Promise.all([
        updatePanel(timestamp, channelId, null, status),
        post(
            inChannelPost(channelId, response, null),
        ),
      ]);
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Clear Songs older than one day
 * @param {String} timestamp
 * @param {String} channelId
 * @param {String} userId
 */
async function clearOneDay(timestamp, channelId, userId) {
  try {
    const {success, response, status} = await setClearOneDay(userId);
    if (!success) {
      await updatePanel(timestamp, channelId, response, status);
    } else {
      await Promise.all([
        updatePanel(timestamp, channelId, null, status),
        post(
            inChannelPost(channelId, response, null),
        ),
      ]);
    }
  } catch (error) {
    logger.error(error);
  }
}

module.exports = {
  jumpToStart,
  openControls,
  pause,
  play,
  skip,
  toggleRepeat,
  toggleShuffle,
  voteToSkip,
};
