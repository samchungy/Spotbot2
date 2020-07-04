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
const play = async (teamId, channelId, auth, deviceId, context, offset, ms) => {
  return await requester(teamId, channelId, auth, 'Play', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    await spotifyApi.play({
      ...deviceId ? {device_id: deviceId} : {},
      ...context ? {context_uri: context} : {},
      ...offset ? {offset: offset} : {},
      ...ms ? {position_ms: ms} : {},
    });
  });
};

/**
 * Hits pause on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} deviceId
 */
const pause = async (teamId, channelId, auth, deviceId) => {
  return await requester(teamId, channelId, auth, 'Pause', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    await spotifyApi.pause({device_id: deviceId});
  });
};

/**
 * Hits skip on Spotify
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 */
const skip = async (teamId, channelId, auth ) => {
  return await requester(teamId, channelId, auth, 'Skip', async () => {
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    await spotifyApi.skipToNext();
  });
};

/**
 * Shuffle Toggle
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} state
 */
const shuffle = async (teamId, channelId, auth, state) => {
  return await requester(teamId, channelId, auth, 'Shuffle', async () =>{
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    await spotifyApi.setShuffle({state: state});
  });
};

/**
 * Repeat Toggle
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} state
 */
const repeat = async (teamId, channelId, auth, state) => {
  return await requester(teamId, channelId, auth, 'Repeat', async () =>{
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth );
    await spotifyApi.setRepeat({state: state});
  });
};

/**
 * Transfer Device
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} deviceId
 */
const transferDevice = async (teamId, channelId, auth, deviceId) => {
  return await requester(teamId, channelId, auth, 'Transfer Device', async () =>{
    const spotifyApi = await spotifyWebApi(teamId, channelId, auth);
    await spotifyApi.transferMyPlayback({device_ids: [deviceId], play: true});
  });
};

module.exports = {
  pause,
  play,
  repeat,
  shuffle,
  skip,
  transferDevice,
};
