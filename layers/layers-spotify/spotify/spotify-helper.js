// Utility Functions
const notPlaying = (status) => (!status || !status.device || !status.item);

module.exports = {
  notPlaying,
};
