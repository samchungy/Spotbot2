const logger = require('../../util/util-logger');
const config = require('config');
const TRACKS = config.get('slack.responses.tracks');
const {findAndStore, getThreeTracks} = require('./tracks-find');
const {findAndStoreArtists, getArtistTracks, getThreeArtists} = require('./tracks-artists-find');
const {getCurrentInfo} = require('./tracks-current');
const {getWhom} = require('./tracks-whom');
const {addTrack} = require('./tracks-add');
const {post, postEphemeral, reply} = require('../slack/slack-api');
const {inChannelPost, deleteReply, ephemeralPost, updateReply} = require('../slack/format/slack-format-reply');
const {removeTrackReview, removeTracks} = require('./tracks-remove');

/**
 * Find an artist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} query
 * @param {string} triggerId
 */
async function findArtists(teamId, channelId, userId, query, triggerId) {
  try {
    const {success, response} = await findAndStoreArtists(teamId, channelId, query, triggerId);
    if (success) {
      await getThreeArtists(teamId, channelId, userId, triggerId);
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
 * Get more Artists
 * @param {string} teamId
 * @param {string} channelId
 * @param {userId} triggerId
 * @param {string} responseUrl
 *
 */
async function getMoreArtists(teamId, channelId, triggerId, responseUrl) {
  try {
    await getThreeArtists(teamId, channelId, null, triggerId, responseUrl);
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
    const [, response] = await Promise.all(
        [reply(deleteReply('', null), responseUrl),
          addTrack(teamId, channelId, userId, trackUri, responseUrl)],
    );
    if (response) {
      await post(
          inChannelPost(channelId, response, null),
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Adds a track to our playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} artistId
 * @param {string} responseUrl
 * @param {string} triggerId
 */
async function viewArtist(teamId, channelId, artistId, responseUrl, triggerId) {
  try {
    const {success, response} = await getArtistTracks(teamId, channelId, artistId, triggerId);
    if (success) {
      await getThreeTracks(teamId, channelId, null, triggerId, responseUrl);
    } else {
      await reply(
          updateReply(response, null),
          responseUrl,
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

module.exports = {
  cancelSearch,
  find,
  findArtists,
  getCurrentInfo,
  getMoreArtists,
  getMoreTracks,
  getWhom,
  removeTrackReview,
  removeTracks,
  setTrack,
  viewArtist,
};
