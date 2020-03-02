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

const modelState = (teamId, channelId, viewId) => {
  return {
    teamId: teamId,
    channelId: channelId,
    viewId: viewId,
  };
};

const allSettingsKeyExpression = `team_channel=:team_channel`;
const allSettingsValues = (teamId, channelId) => {
  return {
    ':team_channel': `${teamId}-${channelId}`,
  };
};

module.exports = {
  allSettingsKeyExpression,
  allSettingsValues,
  modelDevice,
  modelPlaylist,
  modelState,
};
