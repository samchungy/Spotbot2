const config = require('config');
const logger = require('../../util/util-logger');
const LIMIT = config.get('spotify_api.playlists.tracks.limit');
const REMOVE_MODAL = config.get('slack.actions.remove_modal');
const {loadPlaylist, loadProfile} = require('../settings/settings-interface');
const {fetchPlaylistTotal, fetchTracks, deleteTracks} = require('../spotify-api/spotify-api-playlists');
const {loadSearch} = require('../tracks/tracks-dal');
const PlaylistTrack = require('../../util/util-spotify-playlist-track');
const {ephemeralPost} = require('../slack/format/slack-format-reply');
const {sendModal, postEphemeral} = require('../slack/slack-api');
const {option, multiSelectStatic, slackModal} = require('../slack/format/slack-format-modal');

const REMOVE_RESPONSES = {
  no_songs: `You have not added any songs to the playlist.`,
  removed: `:put_litter_in_its_place: The requested tracks were removed from the playlist.`,
};

/**
 * Remove User Tracks from the Playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} triggerId
 */
async function removeTrackReview(teamId, channelId, userId, triggerId) {
  try {
    const [playlist, {country}] = await Promise.all([loadPlaylist(teamId, channelId), loadProfile(teamId, channelId)]);
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlist.id);
    const promises = [];
    const attempts = Math.ceil(total/LIMIT);
    for (let offset=0; offset<attempts; offset++) {
      promises.push(new Promise(async (resolve) =>{
        const spotifyTracks = await fetchTracks(teamId, channelId, playlist.id, country, offset*LIMIT);
        const tracksToReview = [];
        const playlistTracks = spotifyTracks.items.map((track) => new PlaylistTrack(track));
        for (let i=0; i<playlistTracks.length; i++) {
          const history = await loadSearch(teamId, channelId, playlistTracks[i].uri);
          if (history && history.userId === userId) {
            tracksToReview.push({
              title: playlistTracks[i].title,
              uri: playlistTracks[i].uri,
              positions: [i+(LIMIT*offset)],
            });
          }
        }
        resolve(tracksToReview);
      }));
    }
    const allTracksPromises = await Promise.all(promises);
    const allTracks = allTracksPromises.flat();
    const allOptions = allTracks.map((track) => option(track.title, track.uri));
    if (allTracks.length) {
      // We have tracks to review, send a modal
      const blocks = [
        multiSelectStatic(REMOVE_MODAL, `Select Tracks to Remove`, 'Selected tracks will be removed when you click Confirm', null, allOptions.slice(0, LIMIT)),
      ];
      const view = slackModal(REMOVE_MODAL, `Remove Tracks`, `Confirm`, `Close`, blocks, true, channelId);
      await sendModal(triggerId, view);
    } else {
      postEphemeral(
          ephemeralPost(channelId, userId, REMOVE_RESPONSES.no_songs, null),
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Remove Tracks
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {Object} view
 */
async function removeTracks(teamId, channelId, userId, view) {
  try {
    const submissions = extractSubmissions(view).map((track) => track.value);
    if (!submissions.length) {
      return;
    }
    const [playlist, {country}] = await Promise.all([loadPlaylist(teamId, channelId), loadProfile(teamId, channelId)]);
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, playlist.id);
    // Delete selected tracks. We use this method to preserve the order and time added of the previous tracks.
    const promises = [];
    const attempts = Math.ceil(total/LIMIT);
    for (let offset=0; offset<attempts; offset++) {
      promises.push(new Promise(async (resolve) =>{
        const spotifyTracks = await fetchTracks(teamId, channelId, playlist.id, country, offset*LIMIT);
        const tracksToReview = [];
        const playlistTracks = spotifyTracks.items.map((track) => new PlaylistTrack(track));
        for (let i=0; i<playlistTracks.length; i++) {
          const history = await loadSearch(teamId, channelId, playlistTracks[i].uri);
          if (history && history.userId === userId) {
            tracksToReview.push({
              uri: playlistTracks[i].uri,
              positions: [i+(LIMIT*offset)],
            });
          }
        }
        resolve(tracksToReview);
      }));
    }
    const allTracksPromises = await Promise.all(promises);
    const allTracks = allTracksPromises.flat();
    const tracksToDelete = allTracks.filter((track)=>submissions.includes(track.uri));
    if (tracksToDelete.length) {
      await deleteTracks(teamId, channelId, playlist.id, tracksToDelete);
      await postEphemeral(
          ephemeralPost(channelId, userId, REMOVE_RESPONSES.removed, null),
      );
    };
    return;
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Extract the results from the submitted Slack modal view
 * @param {object} view
 * @return {Array} Submission values
 */
function extractSubmissions(view) {
  const values = view.state.values;
  let submissions = [];
  for (const setting in values) {
    if ({}.hasOwnProperty.call(values, setting)) {
      switch (setting) {
        case REMOVE_MODAL:
          submissions = values[setting][setting].selected_options;
          break;
      }
    }
  }
  return submissions;
}


module.exports = {
  removeTracks,
  removeTrackReview,
};
