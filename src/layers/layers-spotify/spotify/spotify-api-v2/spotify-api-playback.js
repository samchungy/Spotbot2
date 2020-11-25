const config = require('./config');
const requester = require('./spotify-api-requester');

const play = async (auth, deviceId, context, offset, ms) => {
  return requester(auth, (client) => {
    return client.put(config.endpoints.play, {
      ...deviceId && {device_id: deviceId},
      ...context && {context_uri: context},
      ...offset && {offset: offset},
      ...ms && {position_ms: ms},
    }, deviceId ? {params: {device_id: deviceId}} : {}).then((response) => response.data);
  });
};

const pause = async (auth, deviceId) => {
  return requester(auth, (client) => {
    return client.put(config.endpoints.pause, null, {...deviceId && {params: {device_id: deviceId}}})
        .then((response) => response.data);
  });
};

const shuffle = async (auth, state) => {
  return requester(auth, (client) => {
    return client.put(config.endpoints.shuffle, null, {params: {state}})
        .then((response) => response.data);
  });
};

const repeat = async (auth, state) => {
  return requester(auth, (client) => {
    return client.put(config.endpoints.repeat, null, {params: {state}})
        .then((response) => response.data);
  });
};

const skip = async (auth) => {
  return requester(auth, (client) => {
    return client.post(config.endpoints.skip)
        .then((response) => response.data);
  });
};

const transferDevice = async (auth, deviceId) => {
  return requester(auth, (client) => {
    return client.put(config.endpoints.player, {
      device_ids: [deviceId],
      play: true,
    }).then((response) => response.data);
  });
};


module.exports = {
  pause,
  play,
  shuffle,
  skip,
  repeat,
  transferDevice,
};

