const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const sns = require('/opt/sns');

// Spotify
const {deleteTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const {skip} = require('/opt/spotify/spotify-api-v2/spotify-api-playback');
const {onPlaylist} = require('/opt/spotify/spotify-helper');

// Slack
const {actionSection, buttonActionElement, contextSection, textSection} = require('/opt/slack/format/slack-format-blocks');
const {deleteChat, post, postEphemeral, updateChat} = require('/opt/slack/slack-api');
const {deleteMessage, ephemeralPost, inChannelPost, messageUpdate} = require('/opt/slack/format/slack-format-reply');

// Settings
const {changeSkipAddVote, changeSkipAddHistory, changeSkipTrimHistory, loadBlacklist, loadSkip} = require('/opt/db/settings-extra-interface');

const SKIP_MAX_HISTORY = config.dynamodb.skip.max_history;
const SKIP_VOTE = config.slack.actions.skip_vote;
const TRACKS_CURRENT = process.env.SNS_PREFIX + 'tracks-current';

const RESPONSE = {
  already: ':information_source: You have already voted on this.',
  blacklist: (title, deleted) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} is on the blacklist and was skipped. ${deleted ? `The track was deleted from the playlist.` : ``}`,
  button: `:black_right_pointing_double_triangle_with_vertical_bar: Skip`,
  confirmation: (title, users) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} was skipped by ${RESPONSE.users(users)}.`,
  failed: ':warning: Skip Failed.',
  users: (users) => `${users.map((user) => `<@${user}>`).join(', ')}`,
  request: (userId, title) => `:black_right_pointing_double_triangle_with_vertical_bar: Skip Request:\n\n <@${userId}> has requested to skip ${title}`,
  voters: (users) => `*Votes*: ${RESPONSE.users(users)}.`,
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
    textSection(RESPONSE.request(userId, trackName)),
    contextSection(null, RESPONSE.votesNeeded(votesNeeded)),
    contextSection(null, RESPONSE.voters(users)),
    actionSection(SKIP_VOTE, [buttonActionElement(SKIP_VOTE, RESPONSE.button, trackId)]),
  ];
};

const addVote = async (teamId, channelId, auth, settings, userId, currentSkip, statusTrack) => {
  // User voted already, ephemeral message to user
  if (currentSkip.votes.users.includes(userId)) {
    const message = ephemeralPost(channelId, userId, RESPONSE.already, null);
    return postEphemeral(message);
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
        .catch((error) => {
          // Race Condition uh oh
          if (error.code && error.code === 'ConditionalCheckFailedException') {
          // Try delete the Slack post first - Let Slack resolve our race
            return resolveSkip(teamId, channelId, auth, settings, currentSkip, statusTrack).then(() => false);
          }
          logger.error(error);
          throw error;
        });

    if (success) {
      const message = messageUpdate(channelId, currentSkip.skip.timestamp, RESPONSE.request(currentSkip.votes.users[0], currentSkip.skip.track.title), skipBlock);
      await updateChat(message);
    }
  } else {
    await resolveSkip(teamId, channelId, auth, settings, currentSkip, statusTrack);
  }
};

const resolveSkip = async (teamId, channelId, auth, settings, currentSkip, statusTrack) => {
  // Slack shall resolve our Skip "Race" if any.
  const message = deleteMessage(channelId, currentSkip.skip.timestamp);
  const deleted = await deleteChat(message)
      .then(() => true)
      .catch((error) => {
        if (error.data && error.data.error && error.data.error.includes('message_not_found')) {
          return false;
        }
        throw error;
      });

  if (deleted) {
    if (currentSkip.votes.users.length !== currentSkip.votes.votesNeeded) { // Race Conditioned
      currentSkip = await loadSkip(teamId, channelId); // threshold was met by another user
    }
    const message = inChannelPost(channelId, RESPONSE.confirmation(statusTrack.title, currentSkip.votes.users), null);
    return Promise.all([
      post(message),
      skipTrack(teamId, channelId, auth, settings, statusTrack),
    ]);
  } // Else do nothing, the other racing skip will resolve
};

const skipTrack = async (teamId, channelId, auth, settings, track) => {
  await Promise.all([
    changeSkipAddHistory(teamId, channelId, {id: track.id, title: track.title})
        .then(async (data) => {
          if (data && data.Attributes && data.Attributes.history && data.Attributes.history.length >= SKIP_MAX_HISTORY) {
            await changeSkipTrimHistory(teamId, channelId);
          }
        })
        .catch((error) => error.code === 'ConditionalCheckFailedException' ? Promise.resolve() : Promise.reject(error)),
    skip(auth),
  ]);
  const params = {
    Message: JSON.stringify({
      teamId,
      channelId,
      settings,
      afterSkip: true,
    }),
    TopicArn: TRACKS_CURRENT,
  };
  await sns.publish(params).promise();
  return;
};

/**
 * Checks if track is on Blacklist - skips and/or deletes track.
 * @param {string} teamId
 * @param {string} channelId
 * @param {*} auth
 * @param {*} settings
 * @param {*} playlist
 * @param {*} status
 * @param {*} statusTrack
 * @return {boolean} Returns true if not on playlist
 */
const onBlacklist = async (teamId, channelId, auth, settings, playlist, status, statusTrack) => {
  const blacklist = await loadBlacklist(teamId, channelId);
  if (blacklist && blacklist.blacklist && blacklist.blacklist.find((track) => statusTrack.id === track.id)) {
    const message = inChannelPost(channelId, RESPONSE.blacklist(statusTrack.title, onPlaylist(status, playlist)));
    await Promise.all([
      skipTrack(teamId, channelId, auth, settings, statusTrack),
      ...onPlaylist(status, playlist) ? [deleteTracks(auth, playlist.id, [{uri: statusTrack.uri}])] : [],
      post(message),
    ]);
    return true;
  } else {
    return false;
  }
};


module.exports = {
  RESPONSE,
  addVote,
  getSkipBlock,
  onBlacklist,
  skipTrack,
};
