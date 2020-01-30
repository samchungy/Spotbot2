const config = require('config');
const moment = require('moment-timezone');
const logger = require('pino')();
const PlaylistTrack = require('../../util/util-spotify-playlist-track');
const {deleteTracks, fetchTracks, fetchPlaylistTotal, replaceTracks} = require('../spotify-api/spotify-api-playlists');
const {loadPlaylistSetting} = require('../settings/settings-dal');
const {sendModal} = require('../slack/slack-api');
const {option, optionGroup, multiSelectStaticGroups, slackModal, selectStatic, yesOrNo} = require('../slack/format/slack-format-modal');
const {textSection} = require('../slack/format/slack-format-blocks');
const {apiTrack} = require('../spotify-api/spotify-api-model');
const {setJumpToStart} = require('./control-jump');
const {extractSubmissions} = require('./control-submissions');

const LIMIT = config.get('spotify_api.playlists.tracks.limit');
const REVIEW = config.get('slack.actions.reset_review');
const REVIEW_JUMP = config.get('slack.actions.reset_review_jump');
const AFRICA = config.get('spotify_api.africa');
const RESET = config.get('slack.responses.playback.reset');


const reviewTitle = (numTracks) => `Hold up! *${numTracks}* ${numTracks > 1 ? `tracks were` : `track was`} added in the past 30 minutes. Are you sure you want to remove ${numTracks > 1 ? `them` : `it`}?`;

/**
 * Review reset modal
 * @param {String} teamId
 * @param {string} channelId
 * @param {String} isClose
 * @param {Object} view
 * @param {String} playlistId
 * @param {String} userId
 */
async function resetReview(teamId, channelId, isClose, view, playlistId, userId) {
  try {
    if (isClose) {
      // Slack Modal was closed. Keep no tracks
      return {success, response, status} = await setReset(teamId, channelId, playlistId, null, userId, false);
    } else {
      // Slack Modal was submitted. Keep whatever tracks were selected
      const {[REVIEW]: trackUris, [REVIEW_JUMP]: jump} = extractSubmissions(view);
      return {success, response, status} = await setReset(teamId, channelId, playlistId, trackUris, userId, (jump == 'true'));
    }
  } catch (error) {
    logger.error(error);
    return {success: false, response: RESET.error, status: null};
  }
}

/**
 * Gets Spotify to reset
 * @param {string} teamId
 * @param {string} channelId
 * @param {String} playlistId
 * @param {String} trackUris
 * @param {String} userId
 * @param {boolean} jump
 */
async function setReset(teamId, channelId, playlistId, trackUris, userId, jump) {
  try {
    let res = `${RESET.success} <@${userId}>.`;
    await reduceTracks(teamId, channelId, playlistId);
    if (trackUris) {
      res = res + ` ${trackUris.length} ${trackUris.length > 1 ? `tracks` : `track`} from the past 30 minutes ${trackUris.length > 1 ? `were` : `was`} kept.`;
      const spotifyTracks = await fetchTracks(teamId, channelId, playlistId, null, 0);
      const allTracks = [];
      spotifyTracks.items
          .map((track) => new PlaylistTrack(track))
          .forEach((track, index) => {
            if (!trackUris.includes(track.uri)) {
              allTracks.push({
                uri: track.uri,
                positions: [index],
              });
            }
          });
      await deleteTracks(teamId, channelId, playlistId, allTracks);
    } else {
      jump = false;
      await replaceTracks(teamId, channelId, playlistId, [AFRICA]);
      await deleteTracks(teamId, channelId, playlistId, [apiTrack(AFRICA)]);
    }
    if (jump) {
      const {success, status} = await setJumpToStart(teamId, channelId, userId);
      if (!success) {
        res = res + ` Spotbot failed to return to the start of the playlist.`;
      } else {
        res = res + ` Spotbot is now playing from the start of the playlist.`;
      }
      return {success: true, response: res, status: status};
    }
    return {success: true, response: res, status: null};
  } catch (error) {
    logger.error('Set Reset failed');
    throw error;
  }
}

/**
 * Set Reset
 * @param {String} teamId
 * @param {String} channelId
 * @param {String} timestamp
 * @param {String} userId
 * @param {String} triggerId
 */
async function startReset(teamId, channelId, timestamp, userId, triggerId) {
  try {
    // Get Tracks Total
    const playlist = await loadPlaylistSetting(teamId, channelId);
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlist.id);

    if (!total) {
      return {success: false, response: RESET.empty, status: null};
    }
    const reviewTracks = await getReviewTracks(teamId, channelId, playlist, total);
    if (reviewTracks.length) {
      // We have tracks to review, send a modal
      const blocks = await getReviewBlocks(reviewTracks);
      const metadata = JSON.stringify({teamId: teamId, playlistId: playlist.id, channelId, timestamp, offset: total-LIMIT});
      const view = slackModal(REVIEW, `Reset: Review Tracks`, `Confirm`, `Close`, blocks, true, metadata);
      await sendModal(triggerId, view);
      return {success: false, response: null, status: null};
    } else {
      // reset
      return await setReset(teamId, channelId, playlist.id, null, userId);
    }
  } catch (error) {
    logger.error('Set reset failed');
    logger.error(error);
  }
}

/**
 * Get review blocks
 * @param {Array} playlistTracks
 */
async function getReviewBlocks(playlistTracks) {
  try {
    // Sort playlist tracks into time buckets
    const buckets = {ten: [], twenty: [], thirty: []};
    const initialOptions = [];
    const tenMinutes = moment().subtract(10, 'minutes');
    const twentyMinutes = moment().subtract(20, 'minutes');
    playlistTracks.forEach((track) => {
      const op = option(track.title, track.uri);
      if (moment(track.addedAt).isSameOrAfter(tenMinutes)) {
        initialOptions.push(op);
        buckets.ten.push(op);
      } else if (moment(track.addedAt).isSameOrAfter(twentyMinutes)) {
        buckets.twenty.push(op);
      } else {
        buckets.thirty.push(op);
      }
    });

    const groups = [];
    Object.keys(buckets).forEach((key) => {
      if (buckets[key].length) {
        switch (key) {
          case `ten`:
            groups.push(optionGroup(`Added less than 10 minutes ago:`, buckets[key]));
            break;
          case `twenty`:
            groups.push(optionGroup(`Added less than 20 minutes ago:`, buckets[key]));
            break;
          default:
            groups.push(optionGroup(`Added less than 30 minutes ago`, buckets[key]));
            break;
        }
      }
    });

    const blocks = [
      textSection(reviewTitle(playlistTracks.length)),
      multiSelectStaticGroups(REVIEW, `Select songs to keep on the playlist`, `Tracks added in the past 10 minutes have been pre-selected. Closing this window will keep none.`, initialOptions.length ? initialOptions : null, groups, true),
      selectStatic(REVIEW_JUMP, `Jump to the start of the playlist?`, `This will only work if a track is selected above.`, option(`Yes`, 'true'), yesOrNo()),
    ];
    return blocks;
  } catch (error) {
    logger.error('Get Review Blocks failed');
    throw error;
  }
}

/**
 * Get tracks to review (Tracks added less than half an hour ago)
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} playlist
 * @param {Number} total
 */
async function getReviewTracks(teamId, channelId, playlist, total) {
  try {
    const reviewTracks = [];
    const hourBefore = moment().subtract(30, 'minutes');
    const offset = Math.max(0, total-LIMIT);
    const spotifyTracks = await fetchTracks(teamId, channelId, playlist.id, null, offset);
    const playlistTracks = spotifyTracks.items.map((track) => new PlaylistTrack(track)).reverse();
    for (track of playlistTracks) {
    // If it was added within the past half an hour
      if (moment(track.addedAt).isAfter(hourBefore)) {
        reviewTracks.push(track);
      } else {
        break;
      }
    }

    return reviewTracks;
  } catch (error) {
    logger.error('Getting Review Tracks failed.');
    throw error;
  }
}

/**
 * Reduce the tracks to 100, the maximum we can keep in the reset review
 * @param {stringId} teamId
 * @param {stringId} channelId
 * @param {stringId} playlistId
 */
async function reduceTracks(teamId, channelId, playlistId) {
  try {
    // If total is > 100, we can delete up until the last 100 songs as we can only show 100 to keep in slack.
    let {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlistId);
    while (total > LIMIT) {
      let spotifyTracks;
      const offset=0;
      const tracksToDelete = [];
      if (total-LIMIT >= LIMIT) {
        spotifyTracks = await fetchTracks(teamId, channelId, playlistId, null, offset, LIMIT);
      } else {
        spotifyTracks = await fetchTracks(teamId, channelId, playlistId, null, offset, total-LIMIT);
      }
      spotifyTracks.items
          .map((track) => new PlaylistTrack(track))
          .forEach((track, index) => {
            tracksToDelete.push({
              uri: track.uri,
              positions: [offset+index],
            });
          });
      await deleteTracks(teamId, channelId, playlistId, tracksToDelete);
      const {tracks: {total: newTotal}} = await fetchPlaylistTotal(teamId, channelId, playlistId);
      total = newTotal;
    }
  } catch (error) {
    throw error;
  }
}


module.exports = {
  resetReview,
  setReset,
  startReset,
};
