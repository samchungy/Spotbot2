const modelDevice = (name, id) => {
  return {
    name: name,
    id: id,
  };
};

const modelPlaylist = (name, id, url) => {
  return {
    name: name,
    id: id,
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
