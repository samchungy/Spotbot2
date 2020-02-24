const SEARCH_EXPIRY = Math.floor(Date.now() / 1000) + 86400; // Current Time in Epoch + 84600 (A day)
const {changeSearch, loadSearch, storeSearch} = require('./tracks-dal');

const changeTracks = (teamId, channelId, triggerId, query, queryVal) => changeSearch(teamId, channelId, triggerId, query, queryVal);
const loadTracks = (teamId, channelId, triggerId, items) => loadSearch(teamId, channelId, triggerId, items);
const storeTracks = (teamId, channelId, triggerId, value) => storeSearch(teamId, channelId, triggerId, value, SEARCH_EXPIRY);


module.exports = {
  changeTracks,
  loadTracks,
  storeTracks,
};
