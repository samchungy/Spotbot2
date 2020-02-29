const moment = require(process.env.MOMENT);
const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {responseUpdate} = require('/opt/control-panel/control-panel');
const {deleteTracks, fetchTracks, fetchPlaylistTotal} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');

const LIMIT = config.spotify_api.playlists.tracks.limit;
const PLAYLIST = config.dynamodb.settings.playlist;

const CLEAR_RESPONSE = {
  success: (userId) => `:put_litter_in_its_place: Tracks older than one day were removed from the playlist by <@${userId}>`,
  error: ':warning: An error occured.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const auth = await authSession(teamId, channelId);
    const playlist = settings[PLAYLIST];
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, auth, playlist.id);
    const aDayAgo = moment().subtract('1', 'day');
    const maxAttempts = Math.ceil(total/LIMIT);
    let attempt = 0;
    let deletedTracks = 0;
    while (attempt<maxAttempts) {
      const offset = attempt*LIMIT-deletedTracks;
      const spotifyTracks = await fetchTracks(teamId, channelId, auth, playlist.id, null, offset);
      const tracksToDelete = [];
      spotifyTracks.items
          .map((track) => new PlaylistTrack(track))
          .forEach((track, index) => {
            if (aDayAgo.isAfter(track.addedAt)) {
              tracksToDelete.push({
                uri: track.uri,
                positions: [index+offset],
              });
            }
          });
      if (tracksToDelete.length) {
        deletedTracks+=tracksToDelete.length;
        await deleteTracks(teamId, channelId, auth, playlist.id, tracksToDelete);
      }
      attempt++;
    }
    return await responseUpdate(teamId, channelId, auth, settings, timestamp, true, CLEAR_RESPONSE.success(userId), null);
  } catch (error) {
    logger.error(error);
    logger.error('Failed to clear one day');
    try {
      const auth = await authSession(teamId, channelId);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, CLEAR_RESPONSE.error, null);
    } catch (error) {
      logger.error(error);
      logger.error('Failed to report clear one day failiure');
    }
  }
};
