const logger = require('../../../layers/config/util-logger');
const {repeat, shuffle} = require('../spotify-api/spotify-api-playback');
const {sleep} = require('../../../layers/misc/util-timeout');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');

const SHUFFLE_RESPONSE = {
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  cannot: ':information_source: Spotify cannot toggle shuffling right now.',
  on: (userId) => `:information_source: Shuffle was enabled by @<${userId}>.`,
  off: (userId) => `:information_source: Shuffle was disabled by @<${userId}>.`,
};

const REPEAT_RESPONSE = {
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  cannot: ':information_source: Spotify cannot toggle repeating right now.',
  on: (userId) => `:information_source: Repeat was enabled by @<${userId}>.`,
  off: (userId) => `:information_source: Repeat was enabled by @<${userId}>.`,
};

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
      return {success: false, response: SHUFFLE_RESPONSE.not_playing, status: status};
    }
    if (status.actions && status.actions.disallows && status.actions.disallows.toggling_shuffle) {
      return {success: false, response: SHUFFLE_RESPONSE.cannot, status: status};
    }

    if (status.shuffle_state) {
      // Turn off shuffle
      await shuffle(teamId, channelId, false);
      await sleep(100);
      return {success: true, response: SHUFFLE_RESPONSE.off(userId), status: null};
    } else {
      // Turn on Shuffle
      await shuffle(teamId, channelId, true);
      await sleep(100);
      return {success: true, response: SHUFFLE_RESPONSE.on(userId), status: null};
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * Toggles repeat on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} userId
 */
async function setRepeat(teamId, channelId, userId) {
  try {
    const status = await fetchCurrentPlayback(teamId, channelId);
    // Spotify is not playing
    if (!status.device) {
      return {success: false, response: REPEAT_RESPONSE.not_playing, status: status};
    }
    if (status.actions && status.actions.disallows && status.actions.disallows.toggling_repeat_context) {
      return {success: false, response: REPEAT_RESPONSE.cannot, status: status};
    }

    if (status.repeat_state === 'track' || status.repeat_state === 'context') {
      // Turn off repeat
      await repeat(teamId, channelId, 'off');
      await sleep(100);
      return {success: true, response: REPEAT_RESPONSE.off(userId), status: null};
    } else {
      // Turn on repeat
      await repeat(teamId, channelId, 'context');
      await sleep(100);
      return {success: true, response: REPEAT_RESPONSE.on(userId), status: null};
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

module.exports = {
  setRepeat,
  setShuffle,
  SHUFFLE_RESPONSE,
  REPEAT_RESPONSE,
};
