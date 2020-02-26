const modelHistory = (id, userId, timeAdded, numAdds) => {
  return {
    id: id,
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

module.exports = {
  changeQuery,
  changeQueryNames,
  changeQueryValue,
  modelHistory,
};
