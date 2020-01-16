const modelSkip = (timestamp, track, users, votesNeeded) => {
  return {
    timestamp: timestamp,
    users: users,
    track: track,
    votesNeeded: votesNeeded,
  };
};

module.exports = {
  modelSkip,
};
