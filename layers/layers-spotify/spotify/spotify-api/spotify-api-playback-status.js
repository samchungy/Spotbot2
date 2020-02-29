const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Fetches user current playback in Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} market
 */
async function fetchCurrentPlayback(teamId, channelId, auth, market) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Get Current Playback', async () => {
    return spotifyApi.getMyCurrentPlaybackState({
      ...market ? {market: market} : {},
    });
  })).body;
}

/**
 * Fetches user current playback in Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {Number} limit
 */
async function fetchRecent(teamId, channelId, auth, limit) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return (await requester(teamId, channelId, auth, 'Get Recent Tracks', async () => {
    return spotifyApi.getMyRecentlyPlayedTracks({
      limit: limit,
    });
  })).body;
}

module.exports = {
  fetchCurrentPlayback,
  fetchRecent,
};
