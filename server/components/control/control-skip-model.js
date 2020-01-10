const modelSkip = (timestamp, track, users) => {
  return {
    timestamp: timestamp,
    users: users,
    track: track,
  };
};

module.exports = {
  modelSkip,
};
