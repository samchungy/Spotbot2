const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Fetches user current playback in Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {number} offset
 * @param {number} limit
 */
async function fetchCurrentPlayback(teamId, channelId ) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return (await requester(teamId, channelId, 'Get Current Playback', async () => await spotifyApi.getMyCurrentPlaybackState())).body;
}

module.exports = {
  fetchCurrentPlayback,
};
