const config = require('/opt/config/config');
const {updateSettings, getSettings, putSettings} = require('/opt/db/settings-dal');

const BACK_TO_PLAYLIST_STATE = config.dynamodb.settings_extra.back_to_playlist_state;
const SKIP = config.dynamodb.settings_extra.skip;
const BLACKLIST = config.dynamodb.settings_extra.blacklist;

/**
 * New skip - keep old history
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} timestamp
 * @param {string} track
 * @param {string[]} users
 * @param {number} votesNeeded
 * @return {Promise}
 */
const createNewSkip = (teamId, channelId, timestamp, track, users, votesNeeded) => {
  const expressionNames = {
    '#Skip': 'skip',
    '#Track': 'track',
    '#Votes': 'votes',
  };
  const expressionValues = {
    ':trackId': track.id,
    ':skip': {
      timestamp: timestamp, // Slack post to update with new vote count
      track: track,
    },
    ':votes': {
      users: users,
      votesNeeded: votesNeeded,
    },
  };
  const updateExpression = 'set #Skip=:skip, #Votes=:votes';
  const conditionExpression = '#Skip.#Track.id<>:trackId'; // Race Condition Checker
  return updateSettings(teamId, channelId, SKIP, expressionNames, expressionValues, updateExpression, conditionExpression);
};

/**
 * Add vote to skip
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} user
 * @param {string} trackId
 * @param {number} votesNeeded
 * @return {Promise}
 */
const changeSkipAddVote = (teamId, channelId, user, trackId, votesNeeded) => {
  const expressionNames = {
    '#Skip': 'skip',
    '#Votes': 'votes',
    '#Users': 'users',
  };
  const expressionValues = {
    ':users': [user],
    ':emptyList': [],
    ':trackId': trackId,
    ':votesNeeded': votesNeeded,
  };
  const updateExpression = 'set #Votes.#Users = list_append(if_not_exists(#Votes.#Users, :emptyList), :users)';
  const conditionExpression = '#Skip.track.id = :trackId and size(#Votes.#Users) < :votesNeeded'; // Race Condition Checker
  return updateSettings(teamId, channelId, SKIP, expressionNames, expressionValues, updateExpression, conditionExpression);
};

/**
 * New history. Add history
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} newTrack
 * @return {Promise}
 */
const changeSkipAddHistory = (teamId, channelId, newTrack) => {
  const expressionNames = {
    '#Skip': 'skip',
    '#Votes': 'votes',
    '#History': 'history',
  };
  const expressionValues = {
    ':history': [newTrack],
    ':trackId': newTrack.id,
    ':skip': null,
    ':votes': null,
    ':emptyList': [],
  };
  // Keep a maximum of 5 tracks in history
  const updateExpression = 'set #History=list_append(:history, if_not_exists(#History, :emptyList)), #Skip=:skip, #Votes=:votes';
  const conditionExpression = '#Skip.track.id <> :skip and #History[0].id <> :trackId'; // Race Condition Checker
  const returnValues = 'UPDATED_NEW';
  return updateSettings(teamId, channelId, SKIP, expressionNames, expressionValues, updateExpression, conditionExpression, returnValues);
};

/**
 * New history. Add history
 * @param {string} teamId
 * @param {string} channelId
 * @return {Promise}
 */
const changeSkipTrimHistory = (teamId, channelId) => {
  const expressionNames = {
    '#History': 'history',
  };
  // Keep a maximum of 5 tracks in history
  const updateExpression = 'remove #History[5], #History[6], #History[7], #History[8], #History[9]';
  return updateSettings(teamId, channelId, SKIP, expressionNames, null, updateExpression, null, null);
};

const changeBackToPlaylistState = (teamId, channelId, time, timeBefore) => {
  const expressionNames = {
    '#Added': 'added',
  };
  const expressionValues = {
    ':time': time,
    ':timeBefore': timeBefore,
  };
  const updateExpression = 'set #Added = :time';
  const conditionExpression = 'attribute_not_exists(#Added) or :timeBefore > #Added'; // Race Condition Checker
  return updateSettings(teamId, channelId, BACK_TO_PLAYLIST_STATE, expressionNames, expressionValues, updateExpression, conditionExpression, null);
};

const changeBlacklistRemove = (teamId, channelId, trackIds) => {
  const expressionNames = {
    '#Blacklist': 'blacklist',
  };
  const updateExpression = 'remove ' + trackIds.map((id) => `#Blacklist[${id}]`).split(', ');
  return updateSettings(teamId, channelId, BLACKLIST, expressionNames, null, updateExpression, null, null);
};

const changeBlacklist = (teamId, channelId, trackIds) => {
  const expressionNames = {
    '#Blacklist': 'blacklist',
  };
  const expressionValues = {
    ':trackIds': trackIds,
    ':emptyList': [],
  };
  const updateExpression = 'set #Blacklist = list_append(if_not_exists(#Blacklist, :emptyList), :trackIds)';
  return updateSettings(teamId, channelId, BLACKLIST, expressionNames, expressionValues, updateExpression, null, null);
};

const loadBlacklist = (teamId, channelId) => getSettings(teamId, channelId, BLACKLIST);
const loadSkip = (teamId, channelId) => getSettings(teamId, channelId, SKIP);

module.exports = {
  createNewSkip,
  changeBlacklist,
  changeBlacklistRemove,
  changeBackToPlaylistState,
  changeSkipAddVote,
  changeSkipAddHistory,
  changeSkipTrimHistory,
  loadBlacklist,
  loadSkip,
};
