const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Fetches user current playback in Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} market
 */
async function fetchCurrentPlayback(teamId, channelId, market) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return (await requester(teamId, channelId, 'Get Current Playback', async () => {
    return spotifyApi.getMyCurrentPlaybackState({
      ...market ? {market: market} : {},
    });
  })).body;
}

module.exports = {
  fetchCurrentPlayback,
};
