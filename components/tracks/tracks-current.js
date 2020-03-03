const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();

const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {loadBlacklist} = require('/opt/settings/settings-extra-interface');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {fetchTracks, fetchPlaylistTotal} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {contextSection, textSection} = require('/opt/slack/format/slack-format-blocks');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {post, postEphemeral} = require('/opt/slack/slack-api');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');

const CONTROL_SKIP_START = process.env.SNS_PREFIX + 'control-skip-start';

const LIMIT = config.spotify_api.playlists.tracks.limit;
const BACK_TO_PLAYLIST = config.dynamodb.settings.back_to_playlist;
const PLAYLIST = config.dynamodb.settings.playlist;


const CURRENT_RESPONSES = {
  error: `:warning: An error occured. Please try again.`,
  currently_playing: (title) => `:sound: Currently playing ${title}.`,
  context_on: (playlist, position, total) => `:information_source: Playing from the Spotbot playlist: ${playlist}. ${position ? `Track ${position} of ${total}.`: ``}`,
  context_track: (title) => `:black_right_pointing_double_triangle_with_vertical_bar: Next Track: ${title}.`,
  context_off: (playlist, back) => `:information_source: Not playing from the Spotbot playlist: ${playlist}. ${back ? ` Spotbot will return when you add songs to the playlist.`: ``}`,
  returning: (playlist) => `:information_source: Spotbot is returning to the Spotbot playlist: ${playlist}. The next song will be back on the playlist.`,
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first. Use `/control` or `/play` to play Spotbot.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, settings} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const auth = await authSession(teamId, channelId);
    const {country} = auth.getProfile();
    const backToPlaylist = settings[BACK_TO_PLAYLIST];
    const playlist = settings[PLAYLIST];

    let text; let track;
    const blocks = [];
    const status = await fetchCurrentPlayback(teamId, channelId, auth, country);
    if (status.item && status.is_playing) {
      track = new Track(status.item);

      text = CURRENT_RESPONSES.currently_playing(track.title);
      blocks.push(textSection(text));
      if (status.context && status.context.uri.includes(playlist.id)) {
        // Find position in playlist
        const {positions, total} = await getAllTrackPositions(teamId, channelId, auth, playlist.id, track.uri);
        if (positions.length == 1) {
          blocks.push(
              contextSection(null, CURRENT_RESPONSES.context_on(`<${playlist.url}|${playlist.name}>`, positions[0].position+1, total)),
          );
          if (positions[0].next) {
            blocks.push(
                contextSection(null, CURRENT_RESPONSES.context_track(positions[0].next.title)),
            );
          }
        } else if (positions.length== 0) {
          blocks.push(contextSection(null, CURRENT_RESPONSES.returning(`<${playlist.url}|${playlist.name}>`)));
        } else {
          blocks.push(contextSection(null, CURRENT_RESPONSES.context_on(`<${playlist.url}|${playlist.name}>`)));
        }
      } else {
        blocks.push(contextSection(null, CURRENT_RESPONSES.context_off(`<${playlist.url}|${playlist.name}>`, backToPlaylist === 'true')));
      }
    } else {
      text = CURRENT_RESPONSES.not_playing;
    }
    await post(
        inChannelPost(channelId, text, blocks.length ? blocks : null),
    );
    // Blacklist, skip if in it.
    const blacklist = await loadBlacklist(teamId, channelId);
    if (blacklist && blacklist.blacklist.find((blacklistTrack)=> track.id === blacklistTrack.id)) {
      const params = {
        Message: JSON.stringify({teamId, channelId, settings, timestamp: null, userId}),
        TopicArn: CONTROL_SKIP_START,
      };
      return await sns.publish(params).promise();
    }
  } catch (error) {
    logger.error(error);
    logger.error('Get current failed');
    try {
      await postEphemeral(
          ephemeralPost(channelId, userId, CURRENT_RESPONSES.error, null),
      );
    } catch (error) {
      logger.error(error);
      logger.error('Failed to report current Slack');
    }
  }
};

/**
 * Get Track Positions
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} playlistId
 * @param {string} trackUri
 */
async function getAllTrackPositions(teamId, channelId, auth, playlistId, trackUri) {
  try {
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, auth, playlistId);
    const promises = [];
    const attempts = Math.ceil(total/LIMIT);
    for (let offset=0; offset<attempts; offset++) {
      promises.push(getTracks(teamId, channelId, auth, playlistId, offset));
    }
    const allTracksPromises = await Promise.all(promises);
    const positions = [];
    allTracksPromises.flat().forEach((track, index, array) => {
      if (track.uri === trackUri) {
        if (index+1 != array.length) {
          positions.push({position: index, next: array[index+1]});
        } else {
          positions.push({position: index, next: null});
        }
      }
    });
    return {positions: positions, total};
  } catch (error) {
    logger.error('Get Track positions failed');
    throw error;
  }
}

const getTracks = async (teamId, channelId, auth, playlistId, offset) => {
  const spotifyTracks = await fetchTracks(teamId, channelId, auth, playlistId, null, offset*LIMIT);
  return spotifyTracks.items.map((track) => new PlaylistTrack(track));
};
