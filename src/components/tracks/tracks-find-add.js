const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {addTracksToPlaylist, deleteTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const {play} = require('/opt/spotify/spotify-api-v2/spotify-api-playback');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const {isPlaying, onPlaylist} = require('/opt/spotify/spotify-helper');

// Slack
const {post, reply, postEphemeral} = require('/opt/slack/slack-api');
const {inChannelPost, deleteReply, ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {actionSection, textSection, buttonActionElement} = require('/opt/slack/format/slack-format-blocks');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Settings
const {changeBackToPlaylistState, loadBlacklist} = require('/opt/db/settings-extra-interface');

// History
const {changeTrackHistory, loadTrackHistory} = require('/opt/db/history-interface');

const {findTrackIndex} = require('./layers/find-index');
const {removeUnplayable} = require('./layers/remove-unplayable');

// Util
const {sleep} = require('/opt/utils/util-timeout');

const REPEAT_DURATION = config.dynamodb.settings.disable_repeats_duration;
const BACK_TO_PLAYLIST = config.dynamodb.settings.back_to_playlist;
const PLAYLIST = config.dynamodb.settings.playlist;
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

const handleBackToPlaylist = async (teamId, channelId, userId, auth, playlist, status, track) => {
  const statusTrack = new Track(status.item);
  await changeBackToPlaylistState(teamId, channelId, moment().unix(), moment().subtract('2', 's').unix())
      .catch(async (error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          await sleep(2000); // Wait 2 seconds and then add your track
        }
        return Promise.reject(error);
      });
  await Promise.all([
    setHistory(teamId, channelId, track, userId),
    statusTrack.uri !== track.uri ?
      addTracksToPlaylist(auth, playlist.id, [statusTrack.uri, track.uri]) : // if track being added is the same as the one being added
      addTracksToPlaylist(auth, playlist.id, [track.uri]),
  ]);
  await removeUnplayable(auth, playlist.id);
  const index = await findTrackIndex(auth, playlist.id, auth.getProfile().country, statusTrack.uri);

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
      positions: [index],
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

const extractTrackInfo = async (value) => JSON.parse(value);

const main = async (teamId, channelId, settings, userId, trackValue, responseUrl) => {
  const repeatDuration = settings[REPEAT_DURATION];
  const playlist = settings[PLAYLIST];
  const backToPlaylist = settings[BACK_TO_PLAYLIST];

  const track = await extractTrackInfo(trackValue);

  const msg = deleteReply('', null);
  reply(msg, responseUrl).catch(logger.error);

  const [blacklist, auth] = await Promise.all([loadBlacklist(teamId, channelId), authSession(teamId, channelId)]);

  // Handle Blacklist
  if (blacklist && blacklist.blacklist.find((trackB) => track.id === trackB.id)) {
    const message = inChannelPost(channelId, RESPONSE.blacklist(track.title), null);
    return await post(message);
  }

  const history = await loadTrackHistory(teamId, channelId, track.id);
  // Handle Repeats
  if (history && moment.unix(history.timeAdded).add(repeatDuration, 'hours').isAfter(moment())) {
    const message = inChannelPost(channelId, RESPONSE.repeat(track.title, moment.unix(history.timeAdded).fromNow(), repeatDuration), null);
    return await post(message);
  }
  const status = await fetchCurrentPlayback(auth);
  // Add to our playlist
  if (backToPlaylist === `true`) {
    if (isPlaying(status) && !onPlaylist(status, playlist)) {
      const back = await handleBackToPlaylist(teamId, channelId, userId, auth, playlist, status, track)
          .then(() => true)
          .catch((error) => {
            if (error.code === 'ConditionalCheckFailedException') {
              return false;
            }
            throw error;
          });
      if (back === true) {
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

  if (!isPlaying(status)) {
    return await sendResumeQuestion(channelId, userId, track);
  }

  if (backToPlaylist === `false`) {
    return await sendBackQuestion(channelId, userId, track);
  }
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, trackValue, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, settings, userId, trackValue, responseUrl)
      .catch(async (error)=>{
        logger.error(error, RESPONSE.failed);
        await reportErrorToSlack(channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
module.exports.BUTTON = BUTTON;
