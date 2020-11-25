const config = require('/opt/config/config');
const {fetchPlaylistTotal, fetchTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const LIMIT = config.spotify_api.playlists.tracks.limit;
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');

const findTrackIndex = async (auth, playlistId, country, trackUri) => {
  // Find what track number we just added
  const {total} = await fetchPlaylistTotal(auth, playlistId);
  if (!total) {
    throw new Error('Playlist is empty');
  }
  const offset = Math.max(0, total-LIMIT);
  const playlistTracks = await fetchTracks(auth, playlistId, country, offset, LIMIT);
  const index = playlistTracks.items.reverse().findIndex((ptrack) => {
    const playlistTrack = new PlaylistTrack(ptrack);
    return trackUri === playlistTrack.uri;
  });
  if (index === -1) {
    throw new Error('Could not find added track');
  }
  return (playlistTracks.items.length-1) - index;
};

module.exports = {findTrackIndex};
