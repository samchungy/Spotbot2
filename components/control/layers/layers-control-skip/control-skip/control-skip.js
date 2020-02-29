const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {skip} = require('/opt/spotify/spotify-api/spotify-api-playback');
// const {loadBlacklist} = require('../settings/blacklist/blacklist-dal');
const {changeSkip, storeSkip} = require('/opt/settings/settings-extra-interface');
const {modelSkip} = require('/opt/settings/settings-extra-model');
const {actionSection, buttonActionElement, contextSection, textSection} = require('/opt/slack/format/slack-format-blocks');
const {deleteChat, postEphemeral, post, updateChat} = require('/opt/slack/slack-api');
const {deleteMessage, ephemeralPost, inChannelPost, messageUpdate} = require('/opt/slack/format/slack-format-reply');
const {responseUpdate} = require('/opt/control-panel/control-panel');
const {sleep} = require('/opt/utils/util-timeout');

const SKIP_VOTE = config.slack.actions.skip_vote;
const SKIP_RESPONSE = {
  already: ':information_source: You have already voted on this.',
  button: `:black_right_pointing_double_triangle_with_vertical_bar: Skip`,
  confirmation: (title, users) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} was skipped by ${SKIP_RESPONSE.users(users)}.`,
  failed: ':warning: Skip Failed.',
  users: (users) => `${users.map((user) => `<@${user}>`).join(', ')}`,
  request: (userId, title) => `:black_right_pointing_double_triangle_with_vertical_bar: Skip Request:\n\n <@${userId}> has requested to skip ${title}`,
  voters: (users) => `*Votes*: ${SKIP_RESPONSE.users(users)}.`,
  votesNeeded: (votes) => `*${votes}* more ${votes == 1 ? 'vote' : 'votes'} needed.`,
};

/**
 * Stores skip in history, skips track.
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {Object} track
 * @param {Object} currentSkip
 */
async function setSkip(teamId, channelId, auth, track, currentSkip) {
  try {
    if (!currentSkip) {
      // First time write
      await Promise.all([
        storeSkip(teamId, channelId, modelSkip(null, null, null, null, null, [track])),
        skip(teamId, channelId, auth),
      ]);
    } else {
      // We have a skip object, update it.
      currentSkip.history.unshift(track);
      const newSkip = modelSkip(null, null, null, null, null, currentSkip.history);
      if (currentSkip.skip) {
        await Promise.all([
          changeSkip(teamId, channelId, Object.entries(newSkip).map(([key, value]) => {
            return {key: key, value: value};
          })),
          skip(teamId, channelId, auth),
        ]);
      } else {
        await skip(teamId, channelId, auth);
      }
      await sleep(450);
    }
  } catch (error) {
    logger.error('Skipping failed');
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

/**
 * Add vote to post
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {Object} settings
 * @param {string} userId
 * @param {Object} currentSkip
 * @param {Object} statusTrack
 */
async function addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack) {
  try {
    if (currentSkip.votes.users.includes(userId)) {
      // User voted already, ephemeral message to user
      return await postEphemeral(
          ephemeralPost(channelId, userId, SKIP_RESPONSE.already, null),
      );
    }
    // Add Vote
    currentSkip.votes.users.push(userId);
    currentSkip.votes.votesNeeded = currentSkip.votes.votesNeeded - 1;

    // Check if we're at the threshold
    if (currentSkip.votes.votesNeeded) {
      // Still have votes to go
      const skipBlock = getSkipBlock(userId, currentSkip.votes.votesNeeded, statusTrack.title, statusTrack.id, currentSkip.votes.users);
      const newSkip = modelSkip(null, null, null, currentSkip.votes.users, currentSkip.votes.votesNeeded, null);
      return await Promise.all([
        updateChat(
            messageUpdate(channelId, currentSkip.skip.timestamp, SKIP_RESPONSE.request(currentSkip.votes.users[0], currentSkip.skip.track.title), skipBlock),
        ),
        changeSkip(teamId, channelId, Object.entries(newSkip)
            .map(([key, value]) => {
              return {key: key, value: value};
            })),
      ]);
    } else {
      // Attempt to skip
      try {
        await deleteChat(
            deleteMessage(channelId, currentSkip.skip.timestamp),
        );
        await Promise.all([
          setSkip(teamId, channelId, auth, statusTrack, currentSkip),
          post(
              inChannelPost(channelId, SKIP_RESPONSE.confirmation(statusTrack.title, currentSkip.votes.users), null),
          ),
        ]);
        return await responseUpdate(teamId, channelId, auth, settings, currentSkip.skip.panelTimestamp, true, null, null);
      } catch (error) {
        logger.error(error);
        // Expected behaviour, we have 2 competing skip clicks. Just allow the first to succeed.
        if (error.data && error.data.error && error.data.error.includes('message_not_found')) {
          return;
        }
        await Promise.all([
          deleteChat(
              deleteMessage(channelId, currentSkip.skip.timestamp),
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
    logger.error('Add Vote failed');
  }
};


module.exports = {
  addVote,
  getSkipBlock,
  setSkip,
};
