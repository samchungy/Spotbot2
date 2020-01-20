const logger = require('../../util/util-logger');
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
 * @param {string} teamId
 * @param {string} channelId
 *
 */
async function openControls(teamId, channelId) {
  try {
    try {
      const status = await fetchCurrentPlayback();
      const {altText, currentPanel} = await getCurrentTrackPanel(teamId, channelId, status);

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
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} timestamp
 * @param {string} response
 * @param {Object} status
 */
async function updatePanel(teamId, channelId, timestamp, response, status) {
  try {
    if (!status) {
      status = await fetchCurrentPlayback(teamId, channelId );
    }
    const {altText, currentPanel} = await getCurrentTrackPanel(teamId, channelId, status, response);

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
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} timestamp
 */
async function play(teamId, channelId, timestamp) {
  try {
    const {success, response, status} = await setPlay(teamId, channelId);
    if (!success) {
      await updatePanel(teamId, channelId, timestamp, response, status);
    } else {
      await Promise.all([
        updatePanel(teamId, channelId, timestamp, null, status),
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
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} timestamp
 * @param {string} userId
 */
async function pause(teamId, channelId, timestamp, userId) {
  try {
    const {success, response, status} = await setPause(teamId, channelId, userId);
    if (!success) {
      await updatePanel(teamId, channelId, timestamp, response, status);
    } else {
      await Promise.all([
        updatePanel(teamId, channelId, timestamp, null, status),
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
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} timestamp
 * @param {string} userId
 */
async function skip(teamId, channelId, timestamp, userId) {
  try {
    const {response, status} = await startSkipVote(teamId, channelId, userId);
    await updatePanel(teamId, channelId, timestamp, response, status);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Add vote to skip
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} value
 * @param {string} responseUrl
 */
async function voteToSkip(teamId, channelId, userId, value, responseUrl) {
  try {
    await addVoteFromPost(teamId, channelId, userId, value, responseUrl);
  } catch (error) {
    logger.error('Vote failed');
  }
}

/**
 * Toggles shuffle on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} timestamp
 * @param {String} userId
 */
async function toggleShuffle(teamId, channelId, timestamp, userId) {
  try {
    const {success, response, status} = await setShuffle(teamId, channelId, userId);
    if (!success) {
      await updatePanel(teamId, channelId, timestamp, response, status);
    } else {
      await Promise.all([
        updatePanel(teamId, channelId, timestamp, null, status),
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
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} timestamp
 * @param {String} userId
 */
async function toggleRepeat(teamId, channelId, timestamp, userId) {
  try {
    const {success, response, status} = await setRepeat(teamId, channelId, userId);
    if (!success) {
      await updatePanel(teamId, channelId, timestamp, response, status);
    } else {
      await Promise.all([
        updatePanel(teamId, channelId, timestamp, null, status),
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
 * @param {String} teamId
 * @param {String} channelId
 * @param {String} timestamp
 * @param {String} userId
 */
async function jumpToStart(teamId, channelId, timestamp, userId) {
  try {
    const {success, response, status} = await setJumpToStart(teamId, channelId, userId);
    if (!success) {
      await updatePanel(teamId, channelId, timestamp, response, status);
    } else {
      await Promise.all([
        updatePanel(teamId, channelId, timestamp, null, status),
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
 * @param {String} teamId
 * @param {String} channelId
 * @param {String} timestamp
 * @param {String} userId
 * @param {String} triggerId
 */
async function reset(teamId, channelId, timestamp, userId, triggerId) {
  try {
    const {success, response, status} = await startReset(teamId, channelId, timestamp, userId, triggerId);
    if (!success) {
      await updatePanel(teamId, channelId, timestamp, response, status);
    } else {
      await Promise.all([
        updatePanel(teamId, channelId, timestamp, null, status),
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
    const {teamId, channelId, timestamp, playlistId} = JSON.parse(metadata);
    const {success, response, status} = await resetReview(teamId, channelId, isClose, view, playlistId, userId);
    if (!success) {
      await updatePanel(teamId, channelId, timestamp, response, status);
    } else {
      await Promise.all([
        updatePanel(teamId, channelId, timestamp, null, status),
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
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} timestamp
 * @param {String} userId
 */
async function clearOneDay(teamId, channelId, timestamp, userId) {
  try {
    const {success, response, status} = await setClearOneDay(teamId, channelId, userId);
    if (!success) {
      await updatePanel(teamId, channelId, timestamp, response, status);
    } else {
      await Promise.all([
        updatePanel(teamId, channelId, timestamp, null, status),
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
