const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');
const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {deleteTracks, fetchTracks} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');
const {post} = require('/opt/slack/slack-api');
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');

const LIMIT = config.spotify_api.playlists.tracks.limit;
const PLAYLIST = config.dynamodb.settings.playlist;

const CLEAR_RESPONSE = {
  failed: 'Clearing tracks older than 1 Day failed',
  success: (userId) => `:put_litter_in_its_place: Tracks older than one day were removed from the playlist by <@${userId}>`,
  error: ':warning: An error occured.',
};

const clearOne = async (teamId, channelId, settings, userId) => {
  const auth = await authSession(teamId, channelId);
  const playlist = settings[PLAYLIST];
  const aDayAgo = moment().subtract('1', 'day');
  // If total is > 100, we can delete up until the last 100 songs as we can only show 100 to keep in slack.
  const recursiveDelete = async () => {
    const spotifyTracks = await fetchTracks(teamId, channelId, auth, playlist.id, null);
    const tracksToDelete = spotifyTracks.items
        .reduce((toDelete, track, index) => {
          const playlistTrack = new PlaylistTrack(track);
          if (aDayAgo.isAfter(playlistTrack.addedAt)) {
            toDelete.push({
              uri: playlistTrack.uri,
              positions: [index],
            });
          }
          return toDelete;
        }, []);
    await deleteTracks(teamId, channelId, auth, playlist.id, tracksToDelete);
    if (tracksToDelete.length === LIMIT) {
      await recursiveDelete();
    }
  };
  await recursiveDelete();
  const message = inChannelPost(channelId, CLEAR_RESPONSE.success(userId));
  await post(message);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId} = JSON.parse(event.Records[0].Sns.Message);
  await clearOne(teamId, channelId, settings, userId)
      .catch((error)=>{
        logger.error(error, CLEAR_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, CLEAR_RESPONSE.failed);
      });
};
