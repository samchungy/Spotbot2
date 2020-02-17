const modelDevice = (name, id) => {
  return {
    name: name,
    id: id,
  };
};

const modelPlaylist = (name, id, uri, url) => {
  return {
    name: name,
    id: id,
    uri: uri,
    url: url,
  };
};

const modelProfile = (id, country) => {
  return {
    country: country,
    id: id,
  };
};

const modelState = (teamId, channelId, viewId) => {
  return {
    teamId: teamId,
    channelId: channelId,
    viewId: viewId,
  };
};

module.exports = {
  modelDevice,
  modelPlaylist,
  modelProfile,
  modelState,
};
