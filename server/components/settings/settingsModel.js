// Data Store Models
const modelView = (viewId, triggerId) => {
  return {
    viewId: viewId,
    triggerId: triggerId,
  };
};

/**
 * Playlist Setting Model
 * @param {string} name
 * @param {string} id
 * @param {string} url
 * @return {object} Playlist Setting Model
 */
const modelPlaylist = (name, id, url) => {
  return {
    name: name,
    id: id,
    url: url,
  };
};

const modelDevice = (name, id) => {
  return {
    name: name,
    id: id,
  };
};

module.exports = {
  modelDevice,
  modelPlaylist,
  modelView,
};
