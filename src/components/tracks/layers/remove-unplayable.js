const config = require('/opt/config/config');
const {fetchPlaylistTotal, deleteTracks, fetchTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');
const LIMIT = config.spotify_api.playlists.tracks.limit;

const getAllTracks = async (auth, playlistId, country) => {
  const getTracks = async (auth, playlistId, offset) => {
    const spotifyTracks = await fetchTracks(auth, playlistId, country, offset*LIMIT);
    return spotifyTracks.items.map((track) => new PlaylistTrack(track));
  };

  const {total} = await fetchPlaylistTotal(auth, playlistId);
  const promises = [];
  const attempts = Math.ceil(total/LIMIT);
  for (let offset=0; offset<attempts; offset++) {
    promises.push(getTracks(auth, playlistId, offset));
  }
  return (await Promise.all(promises)).flat();
};

const removeUnplayable = async (auth, playlistId) => {
  const country = auth.getProfile().country;
  const allTracks = await getAllTracks(auth, playlistId, country);
  const tracksToDelete = allTracks.filter((t) => !t.isPlayable);
  if (tracksToDelete.length) {
    await deleteTracks(auth, playlistId, tracksToDelete.map((t) => ({uri: t.uri})));
  }
};

module.exports = {removeUnplayable};

