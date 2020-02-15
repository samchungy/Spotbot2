const modelSkip = (timestamp, track, users, votesNeeded, history) => {
  return {
    timestamp: timestamp,
    users: users,
    track: track,
    votesNeeded: votesNeeded,
    ...history ? {history: history.splice(0, 3)} : {},
  };
};

module.exports = {
  modelSkip,
};
