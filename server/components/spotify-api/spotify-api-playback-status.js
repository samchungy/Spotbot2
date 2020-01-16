const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Fetches user current playback in Spotify
 * @param {number} offset
 * @param {number} limit
 */
async function fetchCurrentPlayback() {
  const spotifyApi = await spotifyWebApi();
  return (await requester('Get Current Playback', async () => await spotifyApi.getMyCurrentPlaybackState())).body;
}

module.exports = {
  fetchCurrentPlayback,
};
