const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const SKIP_MAX_HISTORY = config.dynamodb.skip.max_history;

const {deleteTracks} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {skip} = require('/opt/spotify/spotify-api/spotify-api-playback');
// const {loadBlacklist} = require('../settings/blacklist/blacklist-dal');
const {actionSection, buttonActionElement, contextSection, textSection} = require('/opt/slack/format/slack-format-blocks');
const {deleteChat, post, postEphemeral, updateChat} = require('/opt/slack/slack-api');
const {deleteMessage, ephemeralPost, inChannelPost, messageUpdate} = require('/opt/slack/format/slack-format-reply');
const {changeSkipAddVote, changeSkipAddHistory, changeSkipTrimHistory, loadBlacklist} = require('/opt/db/settings-extra-interface');

const onPlaylist = (status, playlist) => (status.context && status.context.uri.includes(playlist.id));

const SKIP_VOTE = config.slack.actions.skip_vote;
const SKIP_RESPONSE = {
  already: ':information_source: You have already voted on this.',
  blacklist: (title, deleted) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} is on the blacklist and was skipped.${deleted ? ` The track was deleted from the playlist.` : ``}`,
  button: `:black_right_pointing_double_triangle_with_vertical_bar: Skip`,
  confirmation: (title, users) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} was skipped by ${SKIP_RESPONSE.users(users)}.`,
  failed: ':warning: Skip Failed.',
  users: (users) => `${users.map((user) => `<@${user}>`).join(', ')}`,
  request: (userId, title) => `:black_right_pointing_double_triangle_with_vertical_bar: Skip Request:\n\n <@${userId}> has requested to skip ${title}`,
  voters: (users) => `*Votes*: ${SKIP_RESPONSE.users(users)}.`,
  votesNeeded: (votes) => `*${votes}* more ${votes == 1 ? 'vote' : 'votes'} needed.`,
};

/**
 * Skip Message Block
 * @param {String} userId
 * @param {Number} votesNeeded
 * @param {String} trackName
 * @param {String} trackId
 * @param {Array} users
 * @return {Array} Skip Block
 */
const getSkipBlock = (userId, votesNeeded, trackName, trackId, users) => {
  return [
    textSection(SKIP_RESPONSE.request(userId, trackName)),
    contextSection(null, SKIP_RESPONSE.votesNeeded(votesNeeded)),
    contextSection(null, SKIP_RESPONSE.voters(users)),
    actionSection(SKIP_VOTE, [buttonActionElement(SKIP_VOTE, SKIP_RESPONSE.button, trackId)]),
  ];
};

const addVote = async (teamId, channelId, auth, userId, currentSkip, statusTrack) => {
  // User voted already, ephemeral message to user
  if (currentSkip.votes.users.includes(userId)) {
    return postEphemeral(
        ephemeralPost(channelId, userId, SKIP_RESPONSE.already, null),
    );
  }

  // Add Vote
  currentSkip.votes.users.push(userId);
  const votesNeeded = currentSkip.votes.votesNeeded - currentSkip.votes.users.length;

  // Check if we're at the threshold
  if (votesNeeded) {
    // Still have votes to go
    const skipBlock = getSkipBlock(userId, votesNeeded, statusTrack.title, statusTrack.id, currentSkip.votes.users);
    const success = await changeSkipAddVote(teamId, channelId, userId, statusTrack.id, currentSkip.votes.votesNeeded)
        .then(() => true)
        .catch((err) => {
          logger.error(err);
          // Race Condition uh oh
          if (err.code === 'ConditionalCheckFailedException') {
          // Try delete the Slack post first - Let Slack resolve our race
            return resolveSkip(teamId, channelId, auth, userId, currentSkip, statusTrack).then(() => false);
          }
          throw err;
        });

    if (success) {
      return updateChat(
          messageUpdate(channelId, currentSkip.skip.timestamp, SKIP_RESPONSE.request(currentSkip.votes.users[0], currentSkip.skip.track.title), skipBlock),
      );
    }
  } else {
    return resolveSkip(teamId, channelId, auth, userId, currentSkip, statusTrack);
  }
};

const resolveSkip = async (teamId, channelId, auth, userId, currentSkip, statusTrack) => {
  // Slack shall resolve our Skip "Race" if any.
  const deleted = await deleteChat(deleteMessage(channelId, currentSkip.skip.timestamp))
      .then(() => true)
      .catch((err) => {
        if (err.data && err.data.error && err.data.error.includes('message_not_found')) {
          return false;
        }
        throw err;
      });

  if (deleted) {
    if (currentSkip.votes.users.length !== currentSkip.votes.votesNeeded) { // Race Conditioned
      currentSkip = await loadSkip(teamId, channelId);
      currentSkip.votes.users.push(userId);
    }
    return Promise.all([
      post(
          inChannelPost(channelId, SKIP_RESPONSE.confirmation(statusTrack.title, currentSkip.votes.users), null),
      ),
      skipTrack(teamId, channelId, auth, statusTrack),
    ]);
  } // Else do nothing, the other racing skip will resolve
};

const skipTrack = (teamId, channelId, auth, track) => {
  return Promise.all([
    changeSkipAddHistory(teamId, channelId, track)
        .then(async (data) => {
          if (data && data.Attributes && data.Attributes.history && data.Attributes.history.length >= SKIP_MAX_HISTORY) {
            await changeSkipTrimHistory(teamId, channelId);
          }
        })
        .catch((err) => err.code === 'ConditionalCheckFailedException' ? Promise.resolve() : Promise.reject(err)),
    skip(teamId, channelId, auth),
  ]);
};

/**
 * Checks if track is on Blacklist - skips and/or deletes track.
 * @param {string} teamId
 * @param {string} channelId
 * @param {*} auth
 * @param {*} playlist
 * @param {*} status
 * @param {*} statusTrack
 * @return {boolean} Returns true if not on playlist
 */
const onBlacklist = async (teamId, channelId, auth, playlist, status, statusTrack) => {
  const promises = [];
  const blacklist = await loadBlacklist(teamId, channelId);
  if (blacklist && blacklist.blacklist && blacklist.blacklist.find((track) => statusTrack.uri === track.uri)) {
    promises.push(skipTrack(teamId, channelId, auth, track));
    if (onPlaylist(status, playlist)) {
      promises.push(deleteTracks(teamId, channelId, auth, playlist.id, [{uri: statusTrack.uri}]));
    }
    promises.push(post(inChannelPost(channelId, SKIP_RESPONSE.blacklist(statusTrack.title))));
    await Promise.all(promises);
    // TODO Call current track
    return true;
  } else {
    return false;
  }
};


module.exports = {
  addVote,
  getSkipBlock,
  onBlacklist,
  skipTrack,
};
