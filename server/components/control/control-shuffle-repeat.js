const logger = require('pino')();
const config = require('config');
const {repeat, shuffle} = require('../spotify-api/spotify-api-playback');
const {sleep} = require('../../util/util-timeout');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const SHUFFLE = config.get('slack.responses.playback.shuffle');
const REPEAT = config.get('slack.responses.playback.repeat');

/**
 * Toggles shuffle on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} userId
 */
async function setShuffle(teamId, channelId, userId) {
  try {
    const status = await fetchCurrentPlayback(teamId, channelId );
    // Spotify is not playing
    if (!status.device) {
      return {success: false, response: SHUFFLE.not_playing, status: status};
    }
    if (status.actions && status.actions.disallows && status.actions.disallows.toggling_shuffle) {
      return {success: false, response: SHUFFLE.cannot, status: status};
    }

    if (status.shuffle_state) {
      // Turn off shuffle
      await shuffle(teamId, channelId, false);
      await sleep(100);
      return {success: true, response: `${SHUFFLE.off} <@${userId}>.`, status: null};
    } else {
      // Turn on Shuffle
      await shuffle(teamId, channelId, true);
      await sleep(100);
      return {success: true, response: `${SHUFFLE.on} <@${userId}>.`, status: null};
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * Toggles repeat on Spotify
 * @param {String} userId
 */
async function setRepeat(userId) {
  try {
    const status = await fetchCurrentPlayback();
    // Spotify is not playing
    if (!status.device) {
      return {success: false, response: REPEAT.not_playing, status: status};
    }
    if (status.actions && status.actions.disallows && status.actions.disallows.toggling_repeat_context) {
      return {success: false, response: REPEAT.cannot, status: status};
    }

    if (status.repeat_state === 'track' || status.repeat_state === 'context') {
      // Turn off repeat
      await repeat('off');
      await sleep(100);
      return {success: true, response: `${REPEAT.off} <@${userId}>.`, status: null};
    } else {
      // Turn on repeat
      await repeat('context');
      await sleep(100);
      return {success: true, response: `${REPEAT.on} <@${userId}>.`, status: null};
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

module.exports = {
  setRepeat,
  setShuffle,
};
