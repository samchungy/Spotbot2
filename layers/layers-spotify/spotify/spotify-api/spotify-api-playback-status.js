const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Fetches user current playback in Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} market
 */
const fetchCurrentPlayback = async (teamId, channelId, auth, market) => {
  return await requester(teamId, channelId, auth, 'Get Current Playback', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    return spotifyApi.getMyCurrentPlaybackState({
      ...market ? {market: market} : {},
    });
  }).then((data) => data.body);
};

/**
 * Fetches user current playback in Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {Number} limit
 */
const fetchRecent = async (teamId, channelId, auth, limit) => {
  return await requester(teamId, channelId, auth, 'Get Recent Tracks', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    return spotifyApi.getMyRecentlyPlayedTracks({
      limit: limit,
    });
  }).then((data) => data.body);
};

module.exports = {
  fetchCurrentPlayback,
  fetchRecent,
};
