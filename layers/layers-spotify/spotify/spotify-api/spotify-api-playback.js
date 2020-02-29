const spotifyWebApi = require('./spotify-api-client');
const requester = require('./spotify-api-requester');

/**
 * Hits play on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} deviceId
 * @param {string} context
 * @param {String} offset
 * @param {String} ms
 */
async function play(teamId, channelId, auth, deviceId, context, offset, ms) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return await requester(teamId, channelId, auth, 'Play', async () => {
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
 * @param {Object} auth
 * @param {string} deviceId
 */
async function pause(teamId, channelId, auth, deviceId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return await requester(teamId, channelId, auth, 'Pause', async () => {
    await spotifyApi.pause({device_id: deviceId});
  });
}

/**
 * Hits skip on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 */
async function skip(teamId, channelId, auth ) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return await requester(teamId, channelId, auth, 'Skip', async () => {
    await spotifyApi.skipToNext();
  });
}

/**
 * Shuffle Toggle
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} state
 */
async function shuffle(teamId, channelId, auth, state) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return await requester(teamId, channelId, auth, 'Shuffle', async () =>{
    await spotifyApi.setShuffle({state: state});
  });
}

/**
 * Repeat Toggle
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} state
 */
async function repeat(teamId, channelId, auth, state) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
  return await requester(teamId, channelId, auth, 'Repeat', async () =>{
    await spotifyApi.setRepeat({state: state});
  });
}

/**
 * Transfer Device
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} deviceId
 */
async function transferDevice(teamId, channelId, auth, deviceId) {
  const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
  return await requester(teamId, channelId, auth, 'Transfer Device', async () =>{
    await spotifyApi.transferMyPlayback({device_ids: [deviceId], play: true});
  });
}

module.exports = {
  pause,
  play,
  repeat,
  shuffle,
  skip,
  transferDevice,
};
