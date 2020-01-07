const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Fetches user playlists from Spotify
 * @param {number} offset
 * @param {number} limit
 */
async function fetchCurrentPlayback() {
  const spotifyApi = await spotifyWebApi();
  return (await requester('Get All Playlists', () => spotifyApi.getMyCurrentPlaybackState())).body;
}

module.exports = {
  fetchCurrentPlayback,
};
