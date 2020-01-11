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

const modelView = (viewId, triggerId) => {
  return {
    viewId: viewId,
    triggerId: triggerId,
  };
};

module.exports = {
  modelDevice,
  modelPlaylist,
  modelProfile,
  modelView,
};
