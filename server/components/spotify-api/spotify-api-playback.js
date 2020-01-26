const {spotifyWebApi} = require('./spotify-api-initialise');
const requester = require('./spotify-api-requester');

/**
 * Hits play on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} deviceId
 * @param {string} context
 * @param {String} offset
 * @param {String} ms
 */
async function play(teamId, channelId, deviceId, context, offset, ms) {
  const spotifyApi = await spotifyWebApi(teamId, channelId);
  return await requester(teamId, channelId, 'Play', async () => {
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
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} deviceId
 */
async function pause(teamId, channelId, deviceId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId);
  return await requester(teamId, channelId, 'Pause', async () => {
    await spotifyApi.pause({device_id: deviceId});
  });
}

/**
 * Hits skip on Spotify
 * @param {string} teamId
 * @param {string} channelId
 */
async function skip(teamId, channelId ) {
  const spotifyApi = await spotifyWebApi(teamId, channelId);
  return await requester(teamId, channelId, 'Skip', async () => {
    await spotifyApi.skipToNext();
  });
}

/**
 * Shuffle Toggle
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} state
 */
async function shuffle(teamId, channelId, state) {
  const spotifyApi = await spotifyWebApi(teamId, channelId);
  return await requester(teamId, channelId, 'Shuffle', async () =>{
    await spotifyApi.setShuffle({state: state});
  });
}

/**
 * Repeat Toggle
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} state
 */
async function repeat(teamId, channelId, state) {
  const spotifyApi = await spotifyWebApi(teamId, channelId );
  return await requester(teamId, channelId, 'Repeat', async () =>{
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
