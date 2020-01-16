const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Hits play on Spotify
 * @param {string} deviceId
 * @param {string} context
 * @param {String} offset
 * @param {String} ms
 */
async function play(deviceId, context, offset, ms) {
  const spotifyApi = await spotifyWebApi();
  return await requester('Play', async () => {
    await spotifyApi.play({
      device_id: deviceId,
      ...context ? {context_uri: context} : {},
      ...offset ? {offset: offset} : {},
      ...ms ? {position_ms: ms} : {},
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
  return await requester('Skip', async () => {
    await spotifyApi.skipToNext();
  });
}

/**
 * Shuffle Toggle
 * @param {string} state
 */
async function shuffle(state) {
  const spotifyApi = await spotifyWebApi();
  return await requester('Shuffle', async () =>{
    await spotifyApi.setShuffle({state: state});
  });
}

/**
 * Repeat Toggle
 * @param {string} state
 */
async function repeat(state) {
  const spotifyApi = await spotifyWebApi();
  return await requester('Repeat', async () =>{
    await spotifyApi.setRepeat({state: state});
  });
}

module.exports = {
  pause,
  play,
  repeat,
  shuffle,
  skip,
};
