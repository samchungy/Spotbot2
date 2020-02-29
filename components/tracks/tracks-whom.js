const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();

const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);
const moment = require(process.env.MOMENT);

const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {fetchUserProfile} = require('/opt/spotify/spotify-api/spotify-api-profile');
const {fetchPlaylistTotal, fetchTracks} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {loadBlacklist} = require('/opt/settings/settings-extra-interface');
const {loadTrackHistory} = require('/opt/history/history-interface');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {post, postEphemeral} = require('/opt/slack/slack-api');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');

const CONTROL_SKIP_START = process.env.SNS_PREFIX + 'control-skip-start';
const TRACKS_CURRENT = process.env.SNS_PREFIX + 'tracks-current';

const LIMIT = config.spotify_api.playlists.tracks.limit;
const PLAYLIST = config.dynamodb.settings.playlist;

const WHOM_RESPONSE = {
  error: `:warning: An error occured. Please try again.`,
  now_playing_direct: (title, user, time) => `:microphone: ${title} was added directly to the playlist in Spotify ${time} by ${user}.`,
  now_playing: (title, user, time) => `:microphone: ${title} was added was last added ${time} by ${user}.`,
  response: (track) => `:microphone: ${track.title} is playing because Spotbot is returning to the playlist. The next song will be back on the playlist.`,
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, settings} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const playlist = settings[PLAYLIST];
    const auth = await authSession(teamId, channelId);
    const profile = auth.getProfile();
    let text;
    const status = await fetchCurrentPlayback(teamId, channelId, auth, profile.country);
    if (status.item && status.is_playing) {
      const track = new Track(status.item);

      // Blacklist, skip if in it.
      const blacklist = await loadBlacklist(teamId, channelId);
      if (blacklist && blacklist.blacklist.find((blacklistTrack)=> track.id === blacklistTrack.id)) {
        const params = {
          Message: JSON.stringify({teamId, channelId, settings, timestamp: null, userId}),
          TopicArn: CONTROL_SKIP_START,
        };
        return await sns.publish(params).promise();
      }

      if (status.context && status.context.uri.includes(playlist.id)) {
        const playlistTrack = await getTrack(teamId, channelId, auth, playlist.id, profile.country, track.id);
        if (playlistTrack) {
          const userProfile = await fetchUserProfile(teamId, channelId, auth, playlistTrack.addedBy.id);
          if (playlistTrack.addedBy.id === profile.id) {
            // This track was added through Spotbot
            const history = await loadTrackHistory(teamId, channelId, track.id);
            if (!history) {
              text = WHOM_RESPONSE.now_playing_direct(track.title, `<${userProfile.external_urls.spotify}|${userProfile.display_name ? userProfile.display_name : userProfile.id}>`, moment(playlistTrack.addedAt).fromNow());
            } else {
              text = WHOM_RESPONSE.now_playing(track.title, `<@${history.userId}>`, moment(history.timeAdded).fromNow());
            }
          } else {
            text = WHOM_RESPONSE.now_playing_direct(track.title, `<${userProfile.external_urls.spotify}|${userProfile.display_name ? userProfile.display_name : userProfile.id}>`, moment(playlistTrack.addedAt).fromNow());
          }
        } else {
          text = WHOM_RESPONSE.response(track);
        }
      } else {
        return await getCurrentInfo(teamId, channelId, settings, userId);
      }
    } else {
      return await getCurrentInfo(teamId, channelId, settings, userId);
    }
    await post(
        inChannelPost(channelId, text, null),
    );
  } catch (error) {
    logger.error('Get Whom failed');
    logger.error(error);
    try {
      await postEphemeral(
          ephemeralPost(channelId, userId, WHOM_RESPONSE.error, null),
      );
    } catch (error) {
      logger.error(error);
      logger.error('Failed to report current Slack');
    }
  }
};

/**
 * Get Track Position
 * @param {string} teamId
 * @param {string} channelId
 * @param {object} auth
 * @param {string} playlistId
 * @param {string} country
 * @param {string} trackId
 */
async function getTrack(teamId, channelId, auth, playlistId, country, trackId) {
  try {
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, auth, playlistId);
    const attempts = Math.ceil(total/LIMIT);
    // Find track from back to front
    for (let offset = attempts-1; offset >=0; offset--) {
      const spotifyTracks = await fetchTracks(teamId, channelId, auth, playlistId, country, offset*LIMIT);
      const track = spotifyTracks.items
          .map((track) => new PlaylistTrack(track))
          .reverse()
          .find((track) => track.id === trackId);
      if (track) {
        return track;
      }
    }
    return null;
  } catch (error) {
    logger.error('Get Track failed');
    throw error;
  }
}

/**
 * Launches /current lambda
 * @param {string} teamId
 * @param {string} channelId
 * @param {object} settings
 * @param {string} userId
 */
async function getCurrentInfo(teamId, channelId, settings, userId) {
  const params = {
    Message: JSON.stringify({teamId, channelId, settings, userId}),
    TopicArn: TRACKS_CURRENT,
  };
  return await sns.publish(params).promise();
}
