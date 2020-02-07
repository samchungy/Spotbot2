const moment = require('moment-timezone');
const config = require('config');
const logger = require('../../util/util-logger');
const {deleteTracks, fetchTracks, fetchPlaylistTotal} = require('../spotify-api/spotify-api-playlists');
const {loadPlaylist} = require('../settings/settings-interface');
const PlaylistTrack = require('../../util/util-spotify-playlist-track');
const LIMIT = config.get('spotify_api.playlists.tracks.limit');
const CLEAR_RESPONSE = {
  success: (userId) => `:put_litter_in_its_place: Tracks older than one day were removed from the playlist by <@${userId}>`,
  error: ':warning: An error occured.',
};

/**
 * Clear tracks older than one day from playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 */
async function setClearOneDay(teamId, channelId, userId) {
  try {
    const promises = [];
    const playlist = await loadPlaylist(teamId, channelId );
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlist.id);
    const aDayAgo = moment().subtract('1', 'day');
    const attempts = Math.ceil(total/LIMIT);
    for (let offset=0; offset<attempts; offset++) {
      promises.push(getDeleteTracks(teamId, channelId, playlist.id, aDayAgo, offset));
    }
    await Promise.all(promises);
    return {success: true, response: CLEAR_RESPONSE.success(userId), status: null};
  } catch (error) {
    logger.error(error);
    return {success: false, response: CLEAR_RESPONSE.error, status: null};
  }
}

const getDeleteTracks = async (teamId, channelId, playlistId, aDayAgo, offset) => {
  const spotifyTracks = await fetchTracks(teamId, channelId, playlistId, null, offset*LIMIT);
  const tracksToDelete = [];
  spotifyTracks.items
      .map((track) => new PlaylistTrack(track))
      .forEach((track, index) => {
        if (aDayAgo.isAfter(track.addedAt)) {
          tracksToDelete.push({
            uri: track.uri,
            positions: [index+(LIMIT*offset)],
          });
        }
      });
  if (tracksToDelete.length) {
    await deleteTracks(teamId, channelId, playlistId, tracksToDelete);
  }
};


module.exports = {
  CLEAR_RESPONSE,
  setClearOneDay,
};
