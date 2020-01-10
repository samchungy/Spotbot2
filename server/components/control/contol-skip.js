const config = require('config');
const logger = require('pino')();
const moment = require('moment-timezone');
const {skip} = require('../spotify-api/spotify-api-playback');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {loadSkip, storeSkip} = require('./control-dal');
const {loadSkipVotes, loadSkipVotesAfterHours, loadTimezone} = require('../settings/settings-dal');
const {modelSkip} = require('./control-skip-model');
const {actionSection, buttonActionElement, contextSection, textSection} = require('../slack/format/slack-format-blocks');
const {deleteChat, postEphemeral, post, updateChat} = require('../slack/slack-api');
const {deleteMessage, ephemeralPost, inChannelPost, updateMessage} = require('../slack/format/slack-format-reply');
const Track = require('../../util/util-spotify-track');

const SKIP_RESPONSE = config.get('slack.responses.playback.skip');
const SKIP_VOTE = config.get('slack.actions.skip_vote');
const skipRequest = (userId, title) => `:black_right_pointing_double_triangle_with_vertical_bar: <@${userId}> has requested to skip ${title}`;
const skipVoters = (users) => `*Votes*: ${userList(users)}.`;
const userList = (users) => `${users.map((user) => `<@${user}>`).join(', ')}`;
const skipVotesNeeded = (votes) => `${votes} more ${votes == 1 ? 'vote' : 'votes'} needed.`;
const skipConfirmation = (title, users) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} was skipped by ${userList(users)}.`;

/**
 * Skip the track on Spotify
 * @param {String} channelId
 * @param {String} userId
 */
async function startSkipVote(channelId, userId) {
  try {
    // Get current playback status
    let skipVotes; s;
    const [status, timezone] = await Promise.all([fetchCurrentPlayback(), loadTimezone()]);
    // If Time is before 6am or after 6pm local time.
    if (moment().isBefore(moment.tz('6:00', 'hh:mm', timezone)) || moment().isAfter(moment.tz('18:00', 'hh:mm', timezone))) {
      skipVotes = parseInt(await loadSkipVotesAfterHours());
    } else {
      skipVotes = parseInt(await loadSkipVotes());
    }

    // Spotify is not playing anything so we cannot skip
    if (!status.device || !status.item) {
      return {success: false, response: SKIP_RESPONSE.not_playing, status: status};
    }

    const statusTrack = new Track(status.item);
    // Skip threshold is 0
    if (!skipVotes) {
      await setSkip();
      await post(
          inChannelPost(channelId, skipConfirmation(statusTrack.title, [userId])),
      );
      return {success: true, response: null, status: null};
    }

    // See if there is an existing skip request
    const currentSkip = await loadSkip();
    if (currentSkip && currentSkip.track.id == statusTrack.id) {
      // Add Vote to Skip
      await addVote(channelId, userId, currentSkip, skipVotes, status);
      return {success: true, response: null, status: null};
    }

    // Generate a skip request
    const skipBlock = getSkipBlock(userId, skipVotes, statusTrack.title, [userId]);
    const slackPost = await post(
        inChannelPost(channelId, skipRequest(userId, statusTrack.title), skipBlock),
    );

    const model = modelSkip(slackPost.message.ts, statusTrack, [userId]);
    await storeSkip(model);
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * Add a vote to the skip vote, determine if over the threshold
 * @param {String} channelId
 * @param {String} userId
 * @param {String} currentSkip
 * @param {Number} skipVotes
 * @param {Object} status
 */
async function addVote(channelId, userId, currentSkip, skipVotes, status) {
  try {
    if (!currentSkip) {
      [currentSkip, skipVotes, status] = await Promise.all([loadSkip(), loadSkipVotes(), fetchCurrentPlayback()]);
      skipVotes = parseInt(skipVotes);
    }
    const statusTrack = new Track(status.item);

    // Skip Vote has expired
    if (statusTrack.id != currentSkip.track.id) {
      await updateChat(
          updateMessage(channelId, currentSkip.timestamp, SKIP_RESPONSE.expired, null),
      );
      return;
    }

    if (!currentSkip.users.includes(userId)) {
      currentSkip.users.push(userId);
    } else {
      // User voted already, ephemeral message to user
      return await postEphemeral(
          ephemeralPost(channelId, userId, SKIP_RESPONSE.already, null),
      );
    }
    const votesNeeded = (1+skipVotes)-currentSkip.users.length;
    if (votesNeeded) {
      // Still have votes to go
      const skipBlock = getSkipBlock(userId, votesNeeded, statusTrack.title, currentSkip.users);
      await updateChat(
          updateMessage(channelId, currentSkip.timestamp, skipRequest(currentSkip.users[0], currentSkip.track.title), skipBlock),
      );
      return;
    } else {
      // Skip Vote threshold reached
      try {
        await skip();
      } catch (error) {
        await Promise.all([
          deleteChat(
              deleteMessage(channelId, currentSkip.timestamp),
          ),
          post(
              inChannelPost(channelId, SKIP_RESPONSE.failed, null),
          ),
        ]);
      }

      await Promise.all([
        deleteChat(
            deleteMessage(channelId, currentSkip.timestamp),
        ),
        post(
            inChannelPost(channelId, skipConfirmation(statusTrack.title, currentSkip.users), null),
        ),
      ]);
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
 * @param {Array} users
 * @return {Array} Skip Block
 */
function getSkipBlock(userId, votesNeeded, trackName, users) {
  return [
    textSection(skipRequest(userId, trackName)),
    actionSection(SKIP_VOTE, [buttonActionElement(`:black_right_pointing_double_triangle_with_vertical_bar: Skip`, SKIP_VOTE)]),
    contextSection(null, skipVotesNeeded(votesNeeded)),
    contextSection(null, skipVoters(users)),
  ];
}

/**
 * Skip
 */
async function setSkip() {
  try {
    await skip();
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

module.exports = {
  addVote,
  startSkipVote,
};
