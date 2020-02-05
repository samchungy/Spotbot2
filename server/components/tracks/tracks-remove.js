const config = require('config');
const logger = require('../../util/util-logger');
const LIMIT = config.get('spotify_api.playlists.tracks.limit');
const REMOVE_MODAL = config.get('slack.actions.remove_modal');
const {loadPlaylist, loadProfile} = require('../settings/settings-interface');
const {fetchPlaylistTotal, fetchTracks, deleteTracks} = require('../spotify-api/spotify-api-playlists');
const {batchLoadSearch, loadSearch} = require('../tracks/tracks-dal');
const PlaylistTrack = require('../../util/util-spotify-playlist-track');
const {ephemeralPost, inChannelPost} = require('../slack/format/slack-format-reply');
const {sendModal, post, postEphemeral} = require('../slack/slack-api');
const {option, multiSelectStatic, slackModal} = require('../slack/format/slack-format-modal');

const REMOVE_RESPONSES = {
  no_songs: `:information_source: You have not added any songs to the playlist.`,
  no_tracks: `:information_source: There are no tracks on the playlist to remove.`,
  removed: (trackNames, userId) => `:put_litter_in_its_place: ${trackNames.join(', ')} ${trackNames.length > 1 ? `were`: `was`} removed from the playlist by <@${userId}>.`,
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
    const playlist = await loadPlaylist(teamId, channelId);
    const [{tracks: {total}}, {country}] = await Promise.all([fetchPlaylistTotal(teamId, channelId, playlist.id), loadProfile(teamId, channelId)]);
    const allTracks = await getAllTracks(teamId, channelId, playlist.id, country, total);
    if (!allTracks.length) { // No tracks on the playlist
      return await postEphemeral(
          ephemeralPost(channelId, userId, REMOVE_RESPONSES.no_tracks, null),
      );
    }
    // Get a list of unique URIs
    const uniqueUris = [...new Set(allTracks.map((item) => item.uri))];
    const uniqueTracks = allTracks.reduce((unique, track, index) => { // Highly efficient way to filter the tracks after finding the unique Uris
      const offset = index - unique.length;
      if (uniqueUris[index-offset] == track.uri) {
        unique.push(track);
      }
      return unique;
    }, []);

    // Prepare to batch load
    const numSearches = Math.ceil(uniqueUris.length/LIMIT);
    const searchPromises = [];
    for (let i=0; i<numSearches; i++) {
      const offset = i*LIMIT;
      searchPromises.push(batchLoadSearch(teamId, channelId, uniqueUris.slice(offset, offset+LIMIT)));
    }
    const searches = (await Promise.all(searchPromises)).flat();

    if (!searches.length) {
      return await postEphemeral(
          ephemeralPost(channelId, userId, REMOVE_RESPONSES.no_songs, null),
      );
    }

    const userAdditionUris = searches.filter((search) => search.value.userId === userId); // filter for user added songs
    const allOptions = userAdditionUris.map((search) => {
      const track = uniqueTracks.find((track) => track.uri == search.value.uri); // map them back to our tracks
      return option(track.title, track.uri);
    });

    const blocks = [
      multiSelectStatic(REMOVE_MODAL, `Select Tracks to Remove`, 'Selected tracks will be removed when you click Confirm', null, allOptions.slice(0, LIMIT)),
    ];
    const view = slackModal(REMOVE_MODAL, `Remove Tracks`, `Confirm`, `Close`, blocks, true, channelId);
    await sendModal(triggerId, view);
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
    const playlist = await loadPlaylist(teamId, channelId);

    const submissions = extractSubmissions(view).map((track) => {
      return {
        name: track.text.text,
        uri: track.value,
      };
    });
    if (!submissions.length) {
      return;
    }
    await deleteTracks(teamId, channelId, playlist.id, submissions.map((track) => {
      return {
        uri: track.uri,
      };
    }));
    await post(
        inChannelPost(channelId, REMOVE_RESPONSES.removed(submissions.map((track) => track.name), userId), null),
    );
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


/**
 * Get all tracks from a playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} playlistId
 * @param {string} country
 * @param {string} total
 */
async function getAllTracks(teamId, channelId, playlistId, country, total) {
  const promises = [];
  const attempts = Math.ceil(total/LIMIT);
  for (let offset=0; offset<attempts; offset++) {
    promises.push(getTracks(teamId, channelId, playlistId, country, offset*LIMIT));
  }
  return (await Promise.all(promises)).flat();
}

const getTracks = async (teamId, channelId, playlistId, country, offset) => {
  const spotifyTracks = await fetchTracks(teamId, channelId, playlistId, country, offset);
  const allTracks = spotifyTracks.items.map((track) => {
    const playlistTrack = new PlaylistTrack(track);
    return playlistTrack;
  });
  return allTracks;
};

module.exports = {
  removeTracks,
  removeTrackReview,
};
