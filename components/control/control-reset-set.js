const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();

const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');

const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {deleteTracks, fetchTracks, fetchPlaylistTotal, replaceTracks} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {apiTrack} = require('/opt/spotify/spotify-api/spotify-api-model');
const {responseUpdate} = require('/opt/control-panel/control-panel');
const {reply} = require('/opt/slack/slack-api');
const {deleteReply} = require('/opt/slack/format/slack-format-reply');

// const {setJumpToStart} = require('/opt/control/control-jump');

const LIMIT = config.spotify_api.playlists.tracks.limit;
const AFRICA = config.spotify_api.africa;

const RESET_RESPONSE = {
  error: ':warning: An error occured.',
  kept: (trackUris) => ` ${trackUris.length} ${trackUris.length > 1 ? `tracks` : `track`} from the past 30 minutes ${trackUris.length > 1 ? `were` : `was`} kept.`,
  success: (userId) => `:put_litter_in_its_place: The Spotbot playlist was reset by <@${userId}>.`,
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, timestamp, trackUris, userId, jump, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  try {
    if (responseUrl) {
      // Delete the review confirmation block
      await reply(deleteReply('', null), responseUrl);
    }
    let jumpToStart = jump;
    console.log(jumpToStart);
    const playlistId = settings.playlist.id;
    const auth = await authSession(teamId, channelId);
    let res = RESET_RESPONSE.success(userId);
    // As Slack Modals support a maximum of 100 songs. Delete up til 100 songs.
    await reduceTracks(teamId, channelId, auth, playlistId);
    // A reset review was sent
    if (trackUris) {
      res = res + RESET_RESPONSE.kept(trackUris);
      const spotifyTracks = await fetchTracks(teamId, channelId, auth, playlistId, null, 0);
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
        await deleteTracks(teamId, channelId, auth, playlistId, allTracks);
      }
    } else {
      // No songs to keep, delete all.
      jumpToStart = false;
      await replaceTracks(teamId, channelId, auth, playlistId, [AFRICA]);
      await deleteTracks(teamId, channelId, auth, playlistId, [apiTrack(AFRICA)]);
    }
    if (jumpToStart) {
      params = {
        Message: JSON.stringify({teamId, channelId, settings, timestamp, userId, resetResponse: res}),
        TopicArn: process.env.CONTROL_JUMP,
      };
      return await sns.publish(params).promise();
    }
    return await responseUpdate(teamId, channelId, auth, settings, timestamp, true, res, null);
  } catch (error) {
    logger.error(error);
    logger.error('Set Reset failed');
    try {
      const auth = await authSession(teamId, channelId);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, RESET_RESPONSE.error, null);
    } catch (error2) {
      logger.error(error2);
      logger.error('Failed to report reset error');
    }
  }
};

/**
 * Reduce the tracks to 100, the maximum we can keep in the reset review
 * @param {stringId} teamId
 * @param {stringId} channelId
 * @param {Object} auth
 * @param {stringId} playlistId
 */
async function reduceTracks(teamId, channelId, auth, playlistId) {
  try {
    // If total is > 100, we can delete up until the last 100 songs as we can only show 100 to keep in slack.
    let {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, auth, playlistId);
    while (total > LIMIT) {
      let spotifyTracks;
      const offset=0;
      const tracksToDelete = [];
      if (total-LIMIT >= LIMIT) {
        spotifyTracks = await fetchTracks(teamId, channelId, auth, playlistId, null, offset, LIMIT);
      } else {
        spotifyTracks = await fetchTracks(teamId, channelId, auth, playlistId, null, offset, total-LIMIT);
      }
      spotifyTracks.items
          .map((track) => new PlaylistTrack(track))
          .forEach((track, index) => {
            tracksToDelete.push({
              uri: track.uri,
              positions: [offset+index],
            });
          });
      await deleteTracks(teamId, channelId, auth, playlistId, tracksToDelete);
      const {tracks: {total: newTotal}} = await fetchPlaylistTotal(teamId, channelId, auth, playlistId);
      total = newTotal;
    }
  } catch (error) {
    throw error;
  }
}
