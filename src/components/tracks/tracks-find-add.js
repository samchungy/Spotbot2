

const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchPlaylistTotal, addTracksToPlaylist, deleteTracks, fetchTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const {play} = require('/opt/spotify/spotify-api-v2/spotify-api-playback');
const {fetchTrackInfo} = require('/opt/spotify/spotify-api-v2/spotify-api-tracks');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const {isPlaying, onPlaylist} = require('/opt/spotify/spotify-helper');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');

// Slack
const {post, reply, postEphemeral} = require('/opt/slack/slack-api');
const {inChannelPost, deleteReply, ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {actionSection, textSection, buttonActionElement} = require('/opt/slack/format/slack-format-blocks');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Settings
const {changeBackToPlaylistState, loadBlacklist} = require('/opt/db/settings-extra-interface');

// History
const {changeTrackHistory, loadTrackHistory} = require('/opt/db/history-interface');

// Util
const {sleep} = require('/opt/utils/util-timeout');

const REPEAT_DURATION = config.dynamodb.settings.disable_repeats_duration;
const BACK_TO_PLAYLIST = config.dynamodb.settings.back_to_playlist;
const PLAYLIST = config.dynamodb.settings.playlist;
const LIMIT = config.spotify_api.playlists.tracks.limit;
const CONTROLS = config.slack.actions.controls;

const RESPONSE = {
  failed: 'Adding a track failed',
  blacklist: (title) => `:no_entry_sign: ${title} is blacklisted and cannot be added.`,
  error: ':warning: An error occured. Please try again.',
  expired: ':information_source: Search has expired.',
  repeat: (title, timeAgo, repeatDuration) => `:no_entry_sign: ${title} was already added ${timeAgo}. Repeats are disabled for ${repeatDuration} hours in this channel's settings.`,
  success: (title) => `:tada: ${title} was added to the playlist.`,
  success_back: (title) => `:tada: ${title} was added to the playlist. Spotify will return back to the playlist after this song.`,
  resume: (track) => `:information_source: Spotify is currently paused. Would you like to resume playback, start playing from ${track}, or jump to the start of the playlist?`,
  back: (track) => `:information_source: Spotify is currently not playing from the playlist, would you like to start playing from ${track}, or jump to the start of the playlist?`,
};

const BUTTON = {
  track: ':arrow_forward: Play Track',
  resume: ':black_right_pointing_triangle_with_double_vertical_bar: Resume',
  jump: `:leftwards_arrow_with_hook: Jump to Start of Playlist`,
};

/**
 * Sets the History
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} track
 * @param {string} userId
 */
const setHistory = async (teamId, channelId, track, userId) => {
  const expiry = moment().add('1', 'month').unix();
  await changeTrackHistory(teamId, channelId, track.id, userId, moment().unix(), expiry);
};

const handleBackToPlaylist = async (teamId, channelId, userId, auth, playlist, status, track, country) => {
  const statusTrack = new Track(status.item);
  if (!onPlaylist(status, playlist) && isPlaying(status)) {
    await changeBackToPlaylistState(teamId, channelId, moment().unix(), moment().subtract('2', 's').unix())
        .catch(async (error) => {
          if (error.code === 'ConditionalCheckFailedException') {
            await sleep(2000); // Wait 2 seconds and then try again
          }
          return Promise.reject(error);
        });
  }
  await Promise.all([
    setHistory(teamId, channelId, track, userId),
    statusTrack.uri !== track.uri ?
      addTracksToPlaylist(auth, playlist.id, [statusTrack.uri, track.uri]) : // if track being added is the same as the one being added
      addTracksToPlaylist(auth, playlist.id, [track.uri]),
  ]);

  // Find what track number we just added
  const {total} = await fetchPlaylistTotal(auth, playlist.id);
  const offset = Math.max(0, total-LIMIT);
  const playlistTracks = await fetchTracks(auth, playlist.id, country, offset, LIMIT);
  const index = Math.max(0, playlistTracks.items.length-1) - playlistTracks.items.reverse().findIndex((ptrack) => {
    const playlistTrack = new PlaylistTrack(ptrack);
    return statusTrack.uri !== track.uri ? playlistTrack.uri === statusTrack.uri : playlistTrack.uri === track.uri;
  });

  // Reduce the lag
  const newStatus = await fetchCurrentPlayback(auth);

  if (isPlaying(newStatus) && newStatus.item.id === statusTrack.id) {
    await play(auth, newStatus.device.id, playlist.uri, {position: index}, newStatus.progress_ms);
  } else {
    // If a song just changed over, just play the newly added song
    await play(auth, newStatus.device.id, playlist.uri, {position: index});
  }
  if (statusTrack.uri !== track.uri) {
    await deleteTracks(auth, playlist.id, [{
      uri: statusTrack.uri,
    }]);
  }
};

const sendResumeQuestion = async (channelId, userId, track) => {
  const elements = [
    buttonActionElement(CONTROLS.play_close, BUTTON.resume, CONTROLS.play_close),
    buttonActionElement(CONTROLS.play_track, BUTTON.track, track.uri),
    buttonActionElement(CONTROLS.jump_to_start_close, BUTTON.jump, CONTROLS.jump_to_start_close),
  ];
  const blocks = [
    textSection(RESPONSE.resume(track.title)),
    actionSection(null, elements),
  ];
  const message = ephemeralPost(channelId, userId, RESPONSE.resume(track.title), blocks);
  await postEphemeral(message);
};


const sendBackQuestion = async (channelId, userId, track) => {
  const elements = [
    buttonActionElement(CONTROLS.play_track, BUTTON.track, track.uri),
    buttonActionElement(CONTROLS.jump_to_start_close, BUTTON.jump, CONTROLS.jump_to_start_close),
  ];
  const blocks = [
    textSection(RESPONSE.back(track.title)),
    actionSection(null, elements),
  ];
  const message = ephemeralPost(channelId, userId, RESPONSE.back(track.title), blocks);
  await postEphemeral(message);
};

const addTrack = async (teamId, channelId, settings, userId, trackId, responseUrl) => {
  const repeatDuration = settings[REPEAT_DURATION];
  const playlist = settings[PLAYLIST];
  const backToPlaylist = settings[BACK_TO_PLAYLIST];

  const msg = deleteReply('', null);
  reply(msg, responseUrl).catch(logger.error);

  const [blacklist, auth] = await Promise.all([loadBlacklist(teamId, channelId), authSession(teamId, channelId)]);
  const {country} = auth.getProfile();

  const spotifyTrack = await fetchTrackInfo(auth, country, trackId);
  const track = new Track(spotifyTrack);

  // Handle Blacklist
  if (blacklist && blacklist.blacklist.find((trackB) => track.id === trackB.id)) {
    return RESPONSE.blacklist(track.title);
  }

  const history = await loadTrackHistory(teamId, channelId, track.id);
  // Handle Repeats
  if (history && moment.unix(history.timeAdded).add(repeatDuration, 'hours').isAfter(moment())) {
    return RESPONSE.repeat(track.title, moment.unix(history.timeAdded).fromNow(), repeatDuration);
  }

  // Add to our playlist
  if (backToPlaylist === `true`) {
    const status = await fetchCurrentPlayback(auth);
    if (isPlaying(status)) {
      const back = await handleBackToPlaylist(teamId, channelId, userId, auth, playlist, status, track)
          .then(() => true)
          .catch((error) => {
            if (error.code === 'ConditionalCheckFailedException') {
              return false;
            }
            throw error;
          });
      if (back) {
        const message = inChannelPost(channelId, RESPONSE.success_back(track.title));
        return await post(message);
      }
    }
  }

  // Save history + add to playlist
  await Promise.all([
    setHistory(teamId, channelId, track, userId),
    addTracksToPlaylist(auth, playlist.id, [track.uri]),
  ]);
  const message = inChannelPost(channelId, RESPONSE.success(track.title));
  await post(message);

  const status = await fetchCurrentPlayback(auth);
  if (!isPlaying(status)) {
    return await sendResumeQuestion(channelId, userId, track);
  }

  if (backToPlaylist === `false`) {
    return await sendBackQuestion(channelId, userId, track);
  }
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, trackId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  await addTrack(teamId, channelId, settings, userId, trackId, responseUrl)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, RESPONSE.failed);
      });
};
