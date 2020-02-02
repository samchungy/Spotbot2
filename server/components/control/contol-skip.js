const config = require('config');
const logger = require('../../util/util-logger');
const moment = require('moment-timezone');
const {skip} = require('../spotify-api/spotify-api-playback');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {loadBlacklist} = require('../settings/blacklist/blacklist-dal');
const {loadSkip, storeSkip} = require('./control-dal');
const {loadProfile, loadSkipVotes, loadSkipVotesAfterHours, loadTimezone} = require('../settings/settings-dal');
const {modelSkip} = require('./control-skip-model');
const {actionSection, buttonActionElement, contextSection, textSection} = require('../slack/format/slack-format-blocks');
const {deleteChat, postEphemeral, post, reply, updateChat} = require('../slack/slack-api');
const {deleteMessage, ephemeralPost, inChannelPost, messageUpdate, updateReply} = require('../slack/format/slack-format-reply');
const Track = require('../../util/util-spotify-track');

const SKIP_RESPONSE = config.get('slack.responses.playback.skip');
const SKIP_VOTE = config.get('slack.actions.skip_vote');
const skipRequest = (userId, title) => `:black_right_pointing_double_triangle_with_vertical_bar: Skip Request:\n\n <@${userId}> has requested to skip ${title}`;
const skipVoters = (users) => `*Votes*: ${userList(users)}.`;
const userList = (users) => `${users.map((user) => `<@${user}>`).join(', ')}`;
const skipVotesNeeded = (votes) => `*${votes}* more ${votes == 1 ? 'vote' : 'votes'} needed.`;
const skipConfirmation = (title, users) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} was skipped by ${userList(users)}.`;

/**
 * Skip the track on Spotify
 * @param {String} teamId
 * @param {String} channelId
 * @param {String} userId
 */
async function startSkipVote(teamId, channelId, userId) {
  try {
    // Get current playback status
    let skipVotes;
    const {country} = loadProfile(teamId, channelId);
    const status = await fetchCurrentPlayback(teamId, channelId, country);

    // Spotify is not playing anything so we cannot skip
    if (!status.device || !status.item) {
      return {success: false, response: SKIP_RESPONSE.not_playing, status: status};
    }

    const statusTrack = new Track(status.item);

    const blacklist = await loadBlacklist(teamId, channelId);
    if (blacklist.find((track) => statusTrack.uri === track.uri)) {
      await setSkip(teamId, channelId );
      await post(
          inChannelPost(channelId, skipConfirmation(`${statusTrack.title} is on the blacklist and`, [userId])),
      );
      return {success: true, response: null, status: null};
    }


    // See if there is an existing skip request
    const currentSkip = await loadSkip(teamId, channelId);
    if (currentSkip && currentSkip.track && currentSkip.track.id == statusTrack.id) {
      // If so - Add Vote to Skip
      await addVote(teamId, channelId, userId, currentSkip, status);
      return {success: true, response: null, status: null};
    }

    // If Time is before 6am or after 6pm local time.
    const timezone = await loadTimezone(teamId, channelId );
    const now = moment().tz(timezone);
    const currentDay = now.format('YYYY-MM-DD');
    if (now.isBefore(moment.tz(`${currentDay} 06:00`, timezone)) || now.isAfter(moment.tz(`${currentDay} 18:00`, timezone))) {
      skipVotes = parseInt(await loadSkipVotesAfterHours(teamId, channelId));
    } else {
      skipVotes = parseInt(await loadSkipVotes(teamId, channelId ));
    }
    // Skip threshold is 0
    if (!skipVotes) {
      // Store skip for blacklist
      if (currentSkip && currentSkip.history) {
        currentSkip.history.unshift(statusTrack);
        await storeSkip(teamId, channelId, modelSkip(null, null, null, null, currentSkip.history));
      } else {
        await storeSkip(teamId, channelId, modelSkip(null, null, null, null, [statusTrack]));
      }
      await setSkip(teamId, channelId );
      await post(
          inChannelPost(channelId, skipConfirmation(statusTrack.title, [userId])),
      );
      return {success: true, response: null, status: null};
    }

    // else Generate a skip request
    const skipBlock = getSkipBlock(userId, skipVotes, statusTrack.title, statusTrack.id, [userId]);
    const slackPost = await post(
        inChannelPost(channelId, skipRequest(userId, statusTrack.title), skipBlock),
    );

    // Store skip with the message timestamp so that we can update the message later
    const model = modelSkip(slackPost.message.ts, statusTrack, [userId], skipVotes, currentSkip.history);
    await storeSkip(teamId, channelId, model);
    return {success: true, response: null, status: null};
  } catch (error) {
    logger.error(error);
    return {success: false, response: SKIP_RESPONSE.failed, status: null};
  }
};

/**
 * Adds a skip vote from our skip post
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} value
 * @param {string} responseUrl
 */
async function addVoteFromPost(teamId, channelId, userId, value, responseUrl) {
  const [currentSkip, status] = await Promise.all([loadSkip(teamId, channelId), fetchCurrentPlayback(teamId, channelId )]);
  // Skip Vote has expired
  if (!status.item || value != currentSkip.track.id || value != status.item.id) {
    const expiredBlock = [textSection(SKIP_RESPONSE.expired)];
    await reply(
        updateReply(SKIP_RESPONSE.expired, expiredBlock),
        responseUrl,
    );
    return;
  }
  await addVote(teamId, channelId, userId, currentSkip, status);
}

/**
 * Add a vote to the skip vote, determine if over the threshold
 * @param {String} teamId
 * @param {String} channelId
 * @param {String} userId
 * @param {String} currentSkip
 * @param {Object} status
 */
async function addVote(teamId, channelId, userId, currentSkip, status) {
  try {
    const statusTrack = new Track(status.item);

    if (currentSkip.users.includes(userId)) {
      // User voted already, ephemeral message to user
      return await postEphemeral(
          ephemeralPost(channelId, userId, SKIP_RESPONSE.already, null),
      );
    }
    // Add Vote
    currentSkip.users.push(userId);
    currentSkip.votesNeeded = currentSkip.votesNeeded - 1;

    // Check if we're at the threshold
    if (currentSkip.votesNeeded) {
      // Still have votes to go
      const skipBlock = getSkipBlock(userId, currentSkip.votesNeeded, statusTrack.title, statusTrack.id, currentSkip.users);
      await updateChat(
          messageUpdate(channelId, currentSkip.timestamp, skipRequest(currentSkip.users[0], currentSkip.track.title), skipBlock),
      );
      await storeSkip(teamId, channelId, currentSkip);
      return;
    } else {
      // Attempt to skip
      try {
        await deleteChat(
            deleteMessage(channelId, currentSkip.timestamp),
        ),
        await Promise.all([
          skip(teamId, channelId),
          post(
              inChannelPost(channelId, skipConfirmation(statusTrack.title, currentSkip.users), null),
          ),
        ]);
        if (currentSkip && currentSkip.history) {
          currentSkip.history.unshift(statusTrack);
          await storeSkip(teamId, channelId, modelSkip(null, null, null, null, currentSkip.history));
        } else {
          await storeSkip(teamId, channelId, modelSkip(null, null, null, null, [statusTrack]));
        }
      } catch (error) {
        // Expected behaviour, we have 2 competing skip clicks. Just allow the first to succeed.
        if (error.data && error.data.error && error.data.error.includes('message_not_found')) {
          return;
        }
        await Promise.all([
          deleteChat(
              deleteMessage(channelId, currentSkip.timestamp),
          ),
          post(
              inChannelPost(channelId, SKIP_RESPONSE.failed, null),
          ),
        ]);
        throw error;
      }
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Skip Message Block
 * @param {String} userId
 * @param {Number} votesNeeded
 * @param {String} trackName
 * @param {String} trackId
 * @param {Array} users
 * @return {Array} Skip Block
 */
function getSkipBlock(userId, votesNeeded, trackName, trackId, users) {
  return [
    textSection(skipRequest(userId, trackName)),
    contextSection(null, skipVotesNeeded(votesNeeded)),
    contextSection(null, skipVoters(users)),
    actionSection(SKIP_VOTE, [buttonActionElement(SKIP_VOTE, `:black_right_pointing_double_triangle_with_vertical_bar: Skip`, trackId)]),
  ];
}

/**
 * Skip
 * @param {string} teamId
 * @param {string} channelId
 */
async function setSkip(teamId, channelId ) {
  try {
    await skip(teamId, channelId );
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

module.exports = {
  addVote,
  addVoteFromPost,
  startSkipVote,
};
