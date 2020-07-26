const sns = require('/opt/sns');
const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');


// Spotify
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');
const authSession = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {deleteTracks, fetchTracks, fetchPlaylistTotal, replaceTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const {apiTrack} = require('/opt/spotify/spotify-api-v2/spotify-api-model');

// Slack
const {deleteReply, inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reply, post} = require('/opt/slack/slack-api');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const CONTROL_JUMP = process.env.SNS_PREFIX + 'control-jump';
const LIMIT = config.spotify_api.playlists.tracks.limit;
const AFRICA = config.spotify_api.africa;
const PLAYLIST = config.dynamodb.settings.playlist;

const RESET_RESPONSE = {
  failed: 'Reset failed',
  error: ':warning: An error occured.',
  kept: (trackUris, userId) => `${RESET_RESPONSE.success(userId)} ${trackUris.length} ${trackUris.length > 1 ? `tracks` : `track`} from the past 30 minutes ${trackUris.length > 1 ? `were` : `was`} kept.`,
  success: (userId) => `:put_litter_in_its_place: The Spotbot playlist was reset by <@${userId}>.`,
};

/**
 * Reduce the tracks to 100, the maximum we can keep in the reset review
 * @param {Object} auth
 * @param {string} playlist
 */
const reduceTracks = async (auth, playlist) => {
  // If total is > 100, we can delete up until the last 100 songs as we can only show 100 to keep in slack.
  const {total} = await fetchPlaylistTotal(auth, playlist.id);
  const recursiveDelete = async (total) => {
    if (total && total > LIMIT) {
      const offset=0;
      const range = total-LIMIT <= LIMIT ? total-LIMIT : LIMIT;
      const spotifyTracks = await fetchTracks(auth, playlist.id, null, offset, range);
      const tracksToDelete = spotifyTracks.items
          .map((track, index) => {
            const playlistTrack = new PlaylistTrack(track);
            return {
              uri: playlistTrack.uri,
              positions: [offset+index],
            };
          });
      await deleteTracks(auth, playlist.id, tracksToDelete);
      const {total: newTotal} = await fetchPlaylistTotal(auth, playlist.id);
      await recursiveDelete(newTotal);
    }
  };
  await recursiveDelete(total);
};

const keepSelectTracks = async (auth, playlist, trackUris) => {
  const spotifyTracks = await fetchTracks(auth, playlist.id, null, 0);
  if (spotifyTracks.items.length) {
    const allTracks = [];
    spotifyTracks.items
        .map((track) => new PlaylistTrack(track))
        .forEach((track, index) => {
          if (!trackUris.includes(track.uri)) {
            allTracks.push({
              uri: track.uri,
              positions: [index],
            });
          }
        });
    await deleteTracks(auth, playlist.id, allTracks);
  }
};

const setJump = async (teamId, channelId, settings, userId) => {
  const params = {
    Message: JSON.stringify({teamId, channelId, settings, userId}),
    TopicArn: CONTROL_JUMP,
  };
  return await sns.publish(params).promise();
};

const reset = async (teamId, channelId, settings, trackUris, userId, jump, responseUrl) => {
  const playlist = settings[PLAYLIST];
  const auth = await authSession(teamId, channelId);

  // Delete the review confirmation block
  if (responseUrl) {
    const message = deleteReply('', null);
    await reply(message, responseUrl);
  }

  // Reset all
  if (!trackUris) {
    await replaceTracks(auth, playlist.id, [AFRICA]);
    await deleteTracks(auth, playlist.id, [apiTrack(AFRICA)]);
    const message = inChannelPost(channelId, RESET_RESPONSE.success(userId));
    return await post(message);
  }

  // Cut down tracks to 100
  await reduceTracks(auth, playlist);
  await keepSelectTracks(auth, playlist, trackUris);
  const message = inChannelPost(channelId, RESET_RESPONSE.kept(trackUris, userId));
  await post(message);
  if (jump) {
    await setJump(teamId, channelId, settings, userId);
  }
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, trackUris, userId, jump, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  await reset(teamId, channelId, settings, trackUris, userId, jump, responseUrl)
      .catch((error)=>{
        logger.error(error, RESET_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, RESET_RESPONSE.failed);
      });
};
