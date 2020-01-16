const logger = require('../../util/util-logger');
const config = require('config');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {getCurrentTrackPanel, getShuffleRepeatPanel, getControlsPanel} = require('./control-panel');
const {inChannelPost, messageUpdate} = require('../slack/format/slack-format-reply');
const {post, updateChat} = require('../slack/slack-api');
const {setPlay} = require('./control-play');
const {setPause} = require('./control-pause');
const {startSkipVote, addVoteFromPost} = require('./contol-skip');
const {setRepeat, setShuffle} = require('./control-shuffle-repeat');
const {setJumpToStart} = require('./control-jump');
const {startReset, resetReview} = require('./control-reset');
const {setClearOneDay} = require('./control-clear-one');

/**
 * Opens a menu of Spotbot controls
 * @param {string} channelId
 */
async function openControls(channelId) {
  try {
    try {
      const status = await fetchCurrentPlayback();
      const {altText, currentPanel} = await getCurrentTrackPanel(status);

      const controlPanel = [
        ...currentPanel,
        ...getShuffleRepeatPanel(status) ? [getShuffleRepeatPanel(status)] : [],
        getControlsPanel(),
      ];

      await post(
          inChannelPost(channelId, altText, controlPanel),
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
 * @param {string} timestamp
 * @param {string} channelId
 * @param {string} response
 * @param {Object} status
 */
async function updatePanel(timestamp, channelId, response, status) {
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

    await updateChat(
        messageUpdate(channelId, timestamp, altText, controlPanel),
    );
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Hits Play on Spotify
 * @param {string} timestamp
 * @param {string} channelId
 */
async function play(timestamp, channelId) {
  try {
    const {success, response, status} = await setPlay();
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
 * Hits pause on Spotify
 * @param {string} timestamp
 * @param {string} channelId
 * @param {string} userId
 */
async function pause(timestamp, channelId, userId) {
  try {
    const {success, response, status} = await setPause(userId);
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
 * @param {String} timestamp
 * @param {String} channelId
 * @param {String} userId
 */
async function toggleShuffle(timestamp, channelId, userId) {
  try {
    const {success, response, status} = await setShuffle(userId);
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
 * Toggles repeat on Spotify
 * @param {String} timestamp
 * @param {String} channelId
 * @param {String} userId
 */
async function toggleRepeat(timestamp, channelId, userId) {
  try {
    const {success, response, status} = await setRepeat(userId);
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
 * Reset a playlist on Spotify
 * @param {String} timestamp
 * @param {String} channelId
 * @param {String} userId
 * @param {String} triggerId
 */
async function reset(timestamp, channelId, userId, triggerId) {
  try {
    const {success, response, status} = await startReset(timestamp, channelId, userId, triggerId);
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
 * Verify Reset Review
 * @param {String} isClose
 * @param {Object} view
 * @param {String} userId
 */
async function verifyResetReview(isClose, view, userId) {
  try {
    const metadata = view.private_metadata;
    const {channelId, timestamp, playlistId} = JSON.parse(metadata);
    const {success, response, status} = await resetReview(isClose, view, playlistId, userId);
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
  clearOneDay,
  jumpToStart,
  openControls,
  pause,
  play,
  reset,
  skip,
  toggleRepeat,
  toggleShuffle,
  verifyResetReview,
  voteToSkip,
};
