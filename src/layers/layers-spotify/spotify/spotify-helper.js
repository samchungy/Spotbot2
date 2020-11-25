// Utility Functions
const isPlaying = (status) => status.is_playing && status.item && status.device;

const onPlaylist = (status, playlist) => status.context && status.context.uri.includes(playlist.id);

module.exports = {
  isPlaying,
  onPlaylist,
};
