const modelHistory = (uri, userId, time) => {
  return {
    uri: uri,
    userId: userId,
    time: time,
  };
};

module.exports = {
  modelHistory,
};
