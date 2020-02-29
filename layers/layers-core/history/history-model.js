const modelHistory = (id, artistsIds, userId, timeAdded, numAdds) => {
  return {
    id: id,
    artistsIds: artistsIds,
    userId: userId,
    timeAdded: timeAdded,
    numAdds: numAdds,
  };
};

const changeQuery = `SET #ttl = :ttl, userId = :user, timeAdded = :timeAdded, numAdds = numAdds + :inc`;
const changeQueryValue = (userId, timeAdded, expiry) => {
  return {
    ':user': userId,
    ':inc': 1,
    ':timeAdded': timeAdded,
    ':ttl': expiry,
  };
};

const changeQueryNames = {
  '#ttl': 'ttl',
};

const userTrackKeyConditionExpression = `userId = :userId and team_channel = :team_channel`;
// Generates "#id IN (:id0, :id1, ...)"
const userTrackFilterExpression = (trackIds) => `#id IN (${trackIds.map((id, index) => `:id${index}`).join(', ')})`;
const userTrackQueryAttributeNames = {'#id': 'id'};
const userTrackQueryAttributeValues = (teamId, channelId, userId, trackIds) => {
  idMap = {};
  trackIds.forEach((id, index) => idMap[`:id${index}`] = id);
  return {
    ':team_channel': `${teamId}-${channelId}`,
    ':userId': userId,
    ...idMap,
  };
};


module.exports = {
  changeQuery,
  changeQueryNames,
  changeQueryValue,
  modelHistory,
  userTrackKeyConditionExpression,
  userTrackFilterExpression,
  userTrackQueryAttributeNames,
  userTrackQueryAttributeValues,
};
