const moment = require('moment-timezone');
const config = require('config');
const logger = require('pino')();
const {deleteTracks, fetchTracks, fetchPlaylistTotal} = require('../spotify-api/spotify-api-playlists');
const {loadPlaylistSetting} = require('../settings/settings-dal');
const PlaylistTrack = require('../../util/util-spotify-playlist-track');
const LIMIT = config.get('spotify_api.playlists.tracks.limit');
const CLEAR_ONE_RESPONSE = config.get('slack.responses.playback.clear_one');

/**
 * Clear tracks older than one day from playlist
 * @param {string} userId
 */
async function setClearOneDay(userId) {
  try {
    const promises = [];
    const playlist = await loadPlaylistSetting();
    const {tracks: {total}} = await fetchPlaylistTotal(playlist.id);
    const aDayAgo = moment().subtract('1', 'day');
    const attempts = Math.ceil(total/LIMIT);
    console.log(attempts);
    for (let offset=0; offset<attempts; offset++) {
      promises.push(new Promise(async (resolve) =>{
        const spotifyTracks = await fetchTracks(playlist.id, null, offset*LIMIT);
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
        resolve(tracksToDelete);
      }));
    }
    const allTracksPromises = await Promise.all(promises);
    const allTracks = allTracksPromises.flat();
    if (allTracks.length > 0) {
      await deleteTracks(playlist.id, allTracks);
    }
    return {success: true, response: `${CLEAR_ONE_RESPONSE.success} <@${userId}>.`, status: null};
  } catch (error) {
    logger.error(error);
    return {success: false, response: CLEAR_ONE_RESPONSE.error, status: null};
  }
}


module.exports = {
  setClearOneDay,
};
