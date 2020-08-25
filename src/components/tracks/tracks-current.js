const logger = require('/opt/utils/util-logger');
const config = require('/opt/config/config');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const {fetchTracks, fetchPlaylistTotal} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');
const {onPlaylist, isPlaying} = require('/opt/spotify/spotify-helper');
// Slack
const {contextSection, textSection} = require('/opt/slack/format/slack-format-blocks');
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {post} = require('/opt/slack/slack-api');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');
// Skip
const {onBlacklist} = require('/opt/control-skip/control-skip');

const {sleep} = require('/opt/utils/util-timeout');

const LIMIT = config.spotify_api.playlists.tracks.limit;
const BACK_TO_PLAYLIST = config.dynamodb.settings.back_to_playlist;
const PLAYLIST = config.dynamodb.settings.playlist;

const RESPONSE = {
  failed: 'Getting current status failed',
  error: `:warning: An error occured. Please try again.`,
  currently_playing: (title) => `:sound: Currently playing ${title}.`,
  context_on: (playlist, position, total) => `:information_source: Playing from the Spotbot playlist: ${playlist}. ${position ? `Track ${position} of ${total}.`: ``}`,
  context_track: (title) => `:black_right_pointing_double_triangle_with_vertical_bar: Next Track: ${title}.`,
  context_off: (playlist, back) => `:information_source: Not playing from the Spotbot playlist: ${playlist}. ${back ? ` Spotbot will return when you add songs to the playlist.`: ``}`,
  returning: (playlist) => `:information_source: This track was recently deleted from the playlist or Spotbot is returning to the Spotbot playlist: ${playlist}`,
  not_playing: ':information_source: Spotify is currently not playing. Use `/control` or `/play` to play Spotbot.',
};
/**
 * Get Track Positions
 * @param {Object} auth
 * @param {string} playlistId
 * @param {string} trackUri
 */
const getAllTrackPositions = async (auth, playlistId, trackUri) => {
  const {total} = await fetchPlaylistTotal(auth, playlistId);
  const promises = [];
  const attempts = Math.ceil(total/LIMIT);
  for (let offset=0; offset<attempts; offset++) {
    promises.push(getTracks(auth, playlistId, offset));
  }
  const allTracksPromises = await Promise.all(promises);
  const positions = allTracksPromises.flat().reduce((pos, t, i, src) => {
    if (t.uri === trackUri) {
      if (i+1 !== src.length) {
        return [...pos, {position: i, next: src[i+1]}];
      } else {
        return [...pos, {position: i, next: null}];
      }
    }
    return pos;
  }, []);
  return {positions: positions, total};
};

const getTracks = async (auth, playlistId, offset) => {
  const spotifyTracks = await fetchTracks(auth, playlistId, null, offset*LIMIT);
  return spotifyTracks.items.map((track) => new PlaylistTrack(track));
};

const getContextBlocks = async (auth, playlist, status, statusTrack, backToPlaylist) => {
  if (onPlaylist(status, playlist)) {
    // Find position in playlist
    const {positions, total} = await getAllTrackPositions(auth, playlist.id, statusTrack.uri);
    switch (positions.length) {
      case 1: {
        return [
          contextSection(null, RESPONSE.context_on(`<${playlist.url}|${playlist.name}>`, positions[0].position+1, total)),
          ...positions[0].next ? [contextSection(null, RESPONSE.context_track(positions[0].next.title))] : [],
        ];
      }
      case 0: {
        return [contextSection(null, RESPONSE.returning(`<${playlist.url}|${playlist.name}>`))];
      }
      default: {
        return [contextSection(null, RESPONSE.context_on(`<${playlist.url}|${playlist.name}>`))];
      }
    }
  } else {
    return [contextSection(null, RESPONSE.context_off(`<${playlist.url}|${playlist.name}>`, backToPlaylist === 'true'))];
  }
};

const main = async (teamId, channelId, settings, afterSkip=false) => {
  const auth = await authSession(teamId, channelId);
  const backToPlaylist = settings[BACK_TO_PLAYLIST];
  const playlist = settings[PLAYLIST];

  if (afterSkip) {
    await sleep(2000);
  }

  const status = await fetchCurrentPlayback(auth, auth.getProfile().country);
  if (!isPlaying(status)) {
    const message = inChannelPost(channelId, RESPONSE.not_playing, null);
    return await post(message);
  }
  const statusTrack = new Track(status.item);
  // Check Blacklist for song - prevent constantly skipping
  if (!afterSkip && await onBlacklist(teamId, channelId, auth, settings, playlist, status, statusTrack)) {
    return;
  }
  const text = RESPONSE.currently_playing(statusTrack.title);
  const blocks = [
    textSection(text),
    ...await getContextBlocks(auth, playlist, status, statusTrack, backToPlaylist),
  ];

  const message = inChannelPost(channelId, text, blocks);
  await post(message);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, afterSkip} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, settings, afterSkip)
      .catch(async (error)=>{
        logger.error(error, RESPONSE.failed);
        await reportErrorToSlack(channelId, null, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
