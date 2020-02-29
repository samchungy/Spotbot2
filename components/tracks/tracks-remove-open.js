const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const PLAYLIST = config.dynamodb.settings.playlist;
const LIMIT = config.spotify_api.playlists.tracks.limit;
const REMOVE_MODAL = config.slack.actions.remove_modal;
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {queryUserTrackHistory} = require('/opt/history/history-interface');
const {fetchPlaylistTotal, fetchTracks} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {updateModal, postEphemeral} = require('/opt/slack/slack-api');
const {option, multiSelectStatic, slackModal} = require('/opt/slack/format/slack-format-modal');
const {userTrackKeyConditionExpression, userTrackFilterExpression, userTrackQueryAttributeNames, userTrackQueryAttributeValues} = require('/opt/history/history-model');

const REMOVE_RESPONSES = {
  error: `:warning: An error occured. Please try again.`,
  no_songs: `:information_source: You have not added any songs to the playlist.`,
  no_tracks: `:information_source: There are no tracks on the playlist to remove.`,
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, viewId, userId} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const auth = await authSession(teamId, channelId);
    const {country, id: profileId} = auth.getProfile();
    const playlist = settings[PLAYLIST];
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, auth, playlist.id);
    const allTracks = await getAllTracks(teamId, channelId, auth, playlist.id, country, profileId, total);
    let blocks = [];
    if (!allTracks.length) { // No tracks on the playlist
      blocks = [
        textSection(REMOVE_RESPONSES.no_tracks),
      ];
    }
    // Get a list of unique URIs
    const uniqueIds = [...new Set(allTracks.map((item) => item.id))];
    const uniqueTracks = allTracks.reduce((unique, track, index) => { // Highly efficient way to filter the tracks after finding the unique Uris
      return (uniqueIds[index-(index - unique.length)] == track.id) ? [...unique, track] : unique;
    }, []);
    let query = [];
    if (uniqueIds.length) {
      query = await queryAllTracks(teamId, channelId, userId, uniqueIds);
    }

    if (!query.length) {
      if (!blocks.length) {
        blocks = [
          textSection(REMOVE_RESPONSES.no_songs),
        ];
      }
    } else {
      const allOptions = query.map((search) => {
        const track = uniqueTracks.find((track) => track.id == search.id); // map them back to our tracks
        return option(track.title, track.id);
      });
      blocks = [
        multiSelectStatic(REMOVE_MODAL, `Select Tracks to Remove`, 'Selected tracks will be removed when you click Confirm', null, allOptions.slice(0, LIMIT)),
      ];
    }
    const view = slackModal(REMOVE_MODAL, `Remove Tracks`, `Confirm`, `Close`, blocks, true, channelId);

    await updateModal(viewId, view);
  } catch (error) {
    logger.error(error);
    logger.error('Opening remove track modal failed');
    try {
      return await postEphemeral(
          ephemeralPost(channelId, userId, REMOVE_RESPONSES.error, null),
      );
    } catch (error2) {
      logger.error(error2);
      logger.error('Failed to report open track modal failiure');
    }
  }
};

/**
 * Get all tracks from a playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} auth
 * @param {string} playlistId
 * @param {string} country
 * @param {string} profileId
 * @param {string} total
 */
async function getAllTracks(teamId, channelId, auth, playlistId, country, profileId, total) {
  const promises = [];
  const attempts = Math.ceil(total/LIMIT);
  for (let offset=0; offset<attempts; offset++) {
    promises.push((async () => {
      const spotifyTracks = await fetchTracks(teamId, channelId, auth, playlistId, country, offset*LIMIT);
      const allTracks = spotifyTracks.items
          .map((track) => {
            const playlistTrack = new PlaylistTrack(track);
            return playlistTrack;
          })
          .filter((playlistTrack) => playlistTrack.addedBy.id === profileId);
      return allTracks;
    })(),
    );
  }
  return (await Promise.all(promises)).flat();
}

/**
 * Get all tracks from a playlist
 * @param {string} teamId
 * @param {string} channelId
 * @param {Object} userId
 * @param {Array} trackIds
 */
async function queryAllTracks(teamId, channelId, userId, trackIds) {
  const maxTracks = 99;
  const attempts = Math.ceil(trackIds.length/maxTracks);
  const promises = [];

  for (let offset=0; offset<attempts; offset++) {
    const i = offset*99;
    promises.push(
        queryUserTrackHistory(
            userTrackKeyConditionExpression,
            userTrackQueryAttributeNames,
            userTrackQueryAttributeValues(teamId, channelId, userId, trackIds.slice(i, i+maxTracks)),
            userTrackFilterExpression(trackIds.slice(i, i+maxTracks)),
        ),
    );
  }
  return (await Promise.all(promises)).flat();
}
