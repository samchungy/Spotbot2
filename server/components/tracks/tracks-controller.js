const logger = require('pino')();
const config = require('config');
const TRACKS = config.get('slack.responses.tracks');
const {findAndStore, getThreeTracks} = require('./tracks-find');
const {getCurrentInfo} = require('./tracks-current');
const {getWhom} = require('./tracks-whom');
const {addTrack} = require('./tracks-add');
const {postEphemeral, post, reply} = require('../slack/slack-api');
const {ephemeralPost, inChannelPost, updateReply} = require('../slack/format/slack-format-reply');

/**
 * Jumps to start of playlist on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} userId
 * @param {String} query
 * @param {String} triggerId
 */
async function find(teamId, channelId, userId, query, triggerId) {
  try {
    const {success, response} = await findAndStore(teamId, channelId, query, triggerId);
    if (success) {
      await getThreeTracks(teamId, channelId, userId, triggerId);
    } else {
      await postEphemeral(
          ephemeralPost(channelId, userId, response, null),
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Deletes a search from db
 * @param {String} responseUrl
 */
async function cancelSearch(responseUrl) {
  try {
    await reply(
        updateReply(TRACKS.cancelled, null),
        responseUrl,
    );
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Get more Tracks
 * @param {string} teamId
 * @param {string} channelId
 * @param {userId} triggerId
 * @param {string} responseUrl
 *
 */
async function getMoreTracks(teamId, channelId, triggerId, responseUrl) {
  try {
    await getThreeTracks(teamId, channelId, null, triggerId, responseUrl);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Adds a track to our playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} trackUri
 * @param {string} responseUrl
 */
async function setTrack(teamId, channelId, userId, trackUri, responseUrl) {
  try {
    const response = await addTrack(teamId, channelId, userId, trackUri, responseUrl);
    await post(
        inChannelPost(channelId, response, null),
    );
  } catch (error) {
    logger.error(error);
  }
}

module.exports = {
  cancelSearch,
  getCurrentInfo,
  getMoreTracks,
  getWhom,
  find,
  setTrack,
};
