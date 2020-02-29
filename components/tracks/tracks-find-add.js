

const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);

const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {addTracksToPlaylist, deleteTracks} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {play} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {fetchTrackInfo} = require('/opt/spotify/spotify-api/spotify-api-tracks');
const {changeTrackHistory, loadTrackHistory, storeTrackHistory} = require('/opt/history/history-interface');
const {modelHistory} = require('/opt/history/history-model');
const {sleep} = require('/opt/utils/util-timeout');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const {loadBackToPlaylistState, loadBlacklist, storeBackToPlaylistState} = require('/opt/settings/settings-extra-interface');
const {post, reply} = require('/opt/slack/slack-api');
const {inChannelPost, deleteReply} = require('/opt/slack/format/slack-format-reply');
const {changeQuery, changeQueryValue, changeQueryNames} = require('/opt/history/history-model');

const REPEAT_DURATION = config.dynamodb.settings.disable_repeats_duration;
const BACK_TO_PLAYLIST = config.dynamodb.settings.back_to_playlist;
const PLAYLIST = config.dynamodb.settings.playlist;

const TRACK_ADD_RESPONSE = {
  blacklist: (title) => `:no_entry_sign: ${title} is blacklisted and cannot be added.`,
  error: ':warning: An error occured. Please try again.',
  expired: ':information_source: Search has expired.',
  repeat: (title, timeAgo, repeatDuration) => `:no_entry_sign: ${title} was already added ${timeAgo}. Repeats are disabled for ${repeatDuration} hours in this channel's settings.`,
  success: (title) => `:tada: ${title} was added to the playlist.`,
  success_back: (title) => `:tada: ${title} was added to the playlist. Spotify will return back to the playlist after this song.`,
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, trackId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);

  try {
    const [, response] = await Promise.all([
      reply(deleteReply('', null), responseUrl),
      addTrack(teamId, channelId, settings, userId, trackId),
    ]);
    if (response) {
      await post(
          inChannelPost(channelId, response, null),
      );
    }
  } catch (error) {
    logger.error('Adding track failed');
    logger.error(error);
  }
};

/**
 * Add a track to the playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} settings
 * @param {string} userId
 * @param {string} trackId
 * @param {string} responseUrl
 */
async function addTrack(teamId, channelId, settings, userId, trackId) {
  try {
    const repeatDuration = settings[REPEAT_DURATION];
    const playlist = settings[PLAYLIST];
    const backToPlaylist = settings[BACK_TO_PLAYLIST];

    const [blacklist, auth] = await Promise.all([loadBlacklist(teamId, channelId), authSession(teamId, channelId)]);
    const {country} = auth.getProfile();

    const spotifyTrack = await fetchTrackInfo(teamId, channelId, auth, country, trackId);
    const track = new Track(spotifyTrack);

    // Handle Blacklist
    if (blacklist && blacklist.blacklist.find((trackB) => track.id === trackB.id)) {
      return TRACK_ADD_RESPONSE.blacklist(track.title);
    }

    const history = await loadTrackHistory(teamId, channelId, track.id);
    // Handle Repeats
    if (history && moment.unix(history.timeAdded).add(repeatDuration, 'hours').isAfter(moment())) {
      return TRACK_ADD_RESPONSE.repeat(track.title, moment.unix(history.timeAdded).fromNow(), repeatDuration);
    }

    // Add to our playlist
    if (backToPlaylist === `true`) {
      const status = await fetchCurrentPlayback(teamId, channelId, auth);
      if (status.is_playing && status.item && (!status.context || !status.context.uri.includes(playlist.id))) {
        const statusTrack = new Track(status.item);
        // If Back to Playlist was not already called within the past 3 seconds
        const state = await loadBackToPlaylistState(teamId, channelId);
        if (!state || moment.unix(state.added).add('1', 'seconds').isBefore(moment())) {
          // Tell Spotbot we are currently getting back to playlist, Remove any invalid tracks, Add current playing song + new track to playlist
          await Promise.all([
            storeBackToPlaylistState(teamId, channelId, {added: moment().unix()}),
            setHistory(teamId, channelId, history, track, userId),
            deleteTracks(teamId, channelId, auth, playlist.id, [{uri: statusTrack.uri}]),
          ]);
          if (statusTrack.uri != track.uri) {
            await addTracksToPlaylist(teamId, channelId, auth, playlist.id, [statusTrack.uri, track.uri]);
          } else {
            await addTracksToPlaylist(teamId, channelId, auth, playlist.id, [track.uri]);
          }
          // // Save our history
          await setBackToPlaylist(teamId, channelId, auth, playlist, statusTrack, status, track);
          return TRACK_ADD_RESPONSE.success_back(track.title);
        } else {
          await sleep(1000); // Wait 2 seconds and then try again (concurrent back 2 playlist requests)
          return await addTrack(teamId, channelId, settings, userId, track.id);
        }
      }
    }
    // Save history + add to playlist
    await Promise.all([setHistory(teamId, channelId, history, track, userId), addTracksToPlaylist(teamId, channelId, auth, playlist.id, [track.uri])]);
    return TRACK_ADD_RESPONSE.success(track.title);
  } catch (error) {
    logger.error(error);
    return TRACK_ADD_RESPONSE.error;
  }
};

/**
 * Sets the History
 * @param {string} teamId
 * @param {string} channelId
 * @param {Objext} history
 * @param {string} track
 * @param {string} userId
 */
async function setHistory(teamId, channelId, history, track, userId) {
  const expiry = moment().add('1', 'month').unix();
  if (history) {
    await changeTrackHistory(teamId, channelId, track.id, changeQuery, changeQueryValue(userId, moment().unix(), expiry), changeQueryNames);
  } else {
    const newHistory = modelHistory(track.id, track.artistsIds, userId, moment().unix(), 1);
    await storeTrackHistory(teamId, channelId, track.id, newHistory, expiry);
  }
}

/**
 * Put spotify back onto the playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {Object} playlist
 * @param {string} statusTrack
 * @param {string} newTrack
 */
async function setBackToPlaylist(teamId, channelId, auth, playlist, statusTrack, newTrack) {
  try {
    // Make another call to reduce the lag
    const status = await fetchCurrentPlayback(teamId, channelId, auth);
    if (status.is_playing && status.item && status.item.id === statusTrack.id) {
      await play(teamId, channelId, auth, status.device.id, playlist.uri, {uri: statusTrack.uri}, status.progress_ms);
    } else {
      await play(teamId, channelId, auth, status.device.id, playlist.uri, {uri: newTrack.uri});
    }
    if (statusTrack.uri != newTrack.uri) {
      await deleteTracks(teamId, channelId, auth, playlist.id, [{
        uri: statusTrack.uri,
      }]);
    }
  } catch (error) {
    logger.error('Setting back to playlist failed');
    throw error;
  }
}
