const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Hits play on Spotify
 * @param {string} deviceId
 * @param {string} context
 */
async function play(deviceId, context) {
  const spotifyApi = await spotifyWebApi();
  return await requester('Play', async () => {
    await spotifyApi.play({
      device_id: deviceId,
      ...context ? {context_uri: context} : {},
    });
  });
}

/**
 * Hits pause on Spotify
 * @param {string} deviceId
 */
async function pause(deviceId) {
  const spotifyApi = await spotifyWebApi();
  return await requester('Pause', async () => {
    await spotifyApi.pause({device_id: deviceId});
  });
}

/**
 * Hits skip on Spotify
 */
async function skip() {
  const spotifyApi = await spotifyWebApi();
  return await requester('Pause', async () => {
    await spotifyApi.skipToNext();
  });
}

module.exports = {
  pause,
  play,
  skip,
};
