const modelSkip = (timestamp, panelTimestamp, track, users, votesNeeded, history) => {
  return {
    ...track ? {skip: {
      timestamp: timestamp,
      panelTimestamp: panelTimestamp,
      track: track,
    }} : {...users ? {} : {skip: null}},
    ...users ? {votes: {
      users: users,
      votesNeeded: votesNeeded,
    }} : {votes: null},
    ...history ? {history: history.splice(0, 3)} : {},
  };
};

module.exports = {
  modelSkip,
};
