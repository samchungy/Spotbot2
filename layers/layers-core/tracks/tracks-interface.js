const {changeSearch, loadSearch, storeSearch} = require('./tracks-dal');

const changeTracks = (teamId, channelId, triggerId, query, queryVal) => changeSearch(teamId, channelId, triggerId, query, queryVal);
const loadTracks = (teamId, channelId, triggerId, items) => loadSearch(teamId, channelId, triggerId, items);
const storeTracks = (teamId, channelId, triggerId, value, expiry) => storeSearch(teamId, channelId, triggerId, value, expiry);

const changeArtists = (teamId, channelId, triggerId, query, queryVal) => changeSearch(teamId, channelId, triggerId, query, queryVal);
const loadArtists = (teamId, channelId, triggerId, items) => loadSearch(teamId, channelId, triggerId, items);
const storeArtists = (teamId, channelId, triggerId, value, expiry) => storeSearch(teamId, channelId, triggerId, value, expiry);


module.exports = {
  changeArtists,
  changeTracks,
  loadArtists,
  loadTracks,
  storeTracks,
  storeArtists,
};
