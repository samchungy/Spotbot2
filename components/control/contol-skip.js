const config = require('config');
const logger = require('../../../layers/config/util-logger');
const moment = require('moment-timezone');
const {skip} = require('../spotify-api/spotify-api-playback');
const {fetchCurrentPlayback} = require('../spotify-api/spotify-api-playback-status');
const {loadBlacklist} = require('../settings/blacklist/blacklist-dal');
const {loadSkip, storeSkip} = require('./control-dal');
const {loadProfile, loadSkipVotes, loadSkipVotesAfterHours, loadTimezone} = require('../settings/settings-interface');
const {modelSkip} = require('./control-skip-model');
const {actionSection, buttonActionElement, contextSection, textSection} = require('../slack/format/slack-format-blocks');
const {deleteChat, postEphemeral, post, reply, updateChat} = require('../slack/slack-api');
const {deleteMessage, ephemeralPost, inChannelPost, messageUpdate, updateReply} = require('../slack/format/slack-format-reply');
const Track = require('../spotify-api/spotifyObjects/util-spotify-track');

const SKIP_VOTE = config.get('slack.actions.skip_vote');
const SKIP_RESPONSE = {
  already: ':information_source: You have already voted on this.',
  button: `:black_right_pointing_double_triangle_with_vertical_bar: Skip`,
  blacklist: (title, users) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} is on the blacklist and was skipped by ${SKIP_RESPONSE.users(users)}.`,
  confirmation: (title, users) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} was skipped by ${SKIP_RESPONSE.users(users)}.`,
  expired: ':information_source: Skip vote has expired.',
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  failed: ':warning: Skip Failed.',
  users: (users) => `${users.map((user) => `<@${user}>`).join(', ')}`,
  request: (userId, title) => `:black_right_pointing_double_triangle_with_vertical_bar: Skip Request:\n\n <@${userId}> has requested to skip ${title}`,
  voters: (users) => `*Votes*: ${SKIP_RESPONSE.users(users)}.`,
  votesNeeded: (votes) => `*${votes}* more ${votes == 1 ? 'vote' : 'votes'} needed.`,
};

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
    const {country} = await loadProfile(teamId, channelId);
    const status = await fetchCurrentPlayback(teamId, channelId, country);

    // Spotify is not playing anything so we cannot skip
    if (!status.device || !status.item) {
      return {success: false, response: SKIP_RESPONSE.not_playing, status: status};
    }

    const statusTrack = new Track(status.item);

    const blacklist = await loadBlacklist(teamId, channelId);
    if (blacklist.find((track) => statusTrack.uri === track.uri)) {
      await skip(teamId, channelId );
      await post(
          inChannelPost(channelId, SKIP_RESPONSE.blacklist(statusTrack.title, [userId])),
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
      await skip(teamId, channelId);
      await post(
          inChannelPost(channelId, SKIP_RESPONSE.confirmation(statusTrack.title, [userId])),
      );
      return {success: true, response: null, status: null};
    }

    // else Generate a skip request
    const skipBlock = getSkipBlock(userId, skipVotes, statusTrack.title, statusTrack.id, [userId]);
    const slackPost = await post(
        inChannelPost(channelId, SKIP_RESPONSE.request(userId, statusTrack.title), skipBlock),
    );
    // Store skip with the message timestamp so that we can update the message later
    const model = modelSkip(slackPost.message.ts, statusTrack, [userId], skipVotes, currentSkip ? currentSkip.history : []);
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
          messageUpdate(channelId, currentSkip.timestamp, SKIP_RESPONSE.request(currentSkip.users[0], currentSkip.track.title), skipBlock),
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
              inChannelPost(channelId, SKIP_RESPONSE.confirmation(statusTrack.title, currentSkip.users), null),
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
    textSection(SKIP_RESPONSE.request(userId, trackName)),
    contextSection(null, SKIP_RESPONSE.votesNeeded(votesNeeded)),
    contextSection(null, SKIP_RESPONSE.voters(users)),
    actionSection(SKIP_VOTE, [buttonActionElement(SKIP_VOTE, SKIP_RESPONSE.button, trackId)]),
  ];
}

module.exports = {
  addVote,
  addVoteFromPost,
  startSkipVote,
  SKIP_RESPONSE,
};
