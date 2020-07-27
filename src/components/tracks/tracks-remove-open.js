const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const authSession = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchPlaylistTotal, fetchTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const PlaylistTrack = require('/opt/spotify/spotify-objects/util-spotify-playlist-track');

// Slack
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {updateModal} = require('/opt/slack/slack-api');
const {option, multiSelectStatic, slackModal} = require('/opt/slack/format/slack-format-modal');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// History
const {searchUserTrackHistory} = require('/opt/db/history-interface');

// Constants
const PLAYLIST = config.dynamodb.settings.playlist;
const LIMIT = config.spotify_api.playlists.tracks.limit;
const REMOVE_MODAL = config.slack.actions.remove_modal;

const REMOVE_RESPONSES = {
  failed: 'Opening track remove modal failed',
  error: `:warning: An error occured. Please try again.`,
  no_songs: `:information_source: You can only remove tracks which you have added. You have not added any songs to the playlist.`,
  no_tracks: `:information_source: There are no tracks on the playlist to remove.`,
};

const getAllTracks = async (auth, playlistId, country, profileId, total) => {
  const promises = [];
  const attempts = Math.ceil(total/LIMIT);
  for (let offset=0; offset<attempts; offset++) {
    promises.push((async () => {
      const spotifyTracks = await fetchTracks(auth, playlistId, country, offset*LIMIT);
      const allTracks = spotifyTracks.items
          .map((track) => new PlaylistTrack(track))
          .filter((playlistTrack) => playlistTrack.addedBy.id === profileId);
      return allTracks;
    })(),
    );
  }
  return (await Promise.all(promises)).flat();
};

const queryAllTracks = async (teamId, channelId, userId, trackIds, offset=0, total=0) => {
  const maxTracks = 99;
  const attempts = Math.ceil(trackIds.length/maxTracks);
  const i = offset*99;
  const tracks = await searchUserTrackHistory(teamId, channelId, userId, trackIds.slice(i, i+maxTracks));
  if (tracks.length + total >= 100 || offset+1 >= attempts) {
    return tracks;
  }
  return tracks.concat(await queryAllTracks(teamId, channelId, userId, trackIds, offset+1, tracks.length));
};

const openRemove = async (teamId, channelId, settings, userId, viewId ) => {
  const auth = await authSession(teamId, channelId);
  const {country, id: profileId} = auth.getProfile();
  const playlist = settings[PLAYLIST];
  const {total} = await fetchPlaylistTotal(auth, playlist.id);
  const allTracks = await getAllTracks(auth, playlist.id, country, profileId, total);

  // No Tracks
  if (!allTracks.length) {
    const blocks = [textSection(REMOVE_RESPONSES.no_tracks)];
    const view = slackModal(REMOVE_MODAL, `Remove Tracks`, null, `Close`, blocks, false, channelId);
    return await updateModal(viewId, view);
  }

  // Get a list of unique URIs
  const uniqueIds = [...new Set(allTracks.map((item) => item.id))];
  const uniqueTracks = allTracks.reduce((unique, track) => {
    // Highly efficient way to filter the tracks after finding the unique Uris
    if (unique.length === uniqueIds.length) {
      return unique;
    }
    return (uniqueIds[unique.length] === track.id) ? [...unique, track] : unique;
  }, []);

  // Check our db for songs only the User added
  const query = await queryAllTracks(teamId, channelId, userId, uniqueIds);
  if (!query.length) {
    const blocks = [textSection(REMOVE_RESPONSES.no_songs)];
    const view = slackModal(REMOVE_MODAL, `Remove Tracks`, null, `Close`, blocks, false, channelId);
    return await updateModal(viewId, view);
  }

  const allOptions = query.map((search) => {
    const track = uniqueTracks.find((track) => track.id == search.id); // map them back to our tracks
    return option(track.title, track.id);
  });

  const blocks = [
    multiSelectStatic(REMOVE_MODAL, `Select Tracks to Remove`, 'Selected tracks will be removed when you click Confirm', null, allOptions.slice(0, LIMIT)),
  ];
  const view = slackModal(REMOVE_MODAL, `Remove Tracks`, `Confirm`, `Close`, blocks, true, channelId);
  await updateModal(viewId, view);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, viewId, userId} = JSON.parse(event.Records[0].Sns.Message);
  await openRemove(teamId, channelId, settings, userId, viewId)
      .catch((error)=>{
        logger.error(error, REMOVE_RESPONSES.failed);
        reportErrorToSlack(teamId, channelId, null, REMOVE_RESPONSES.failed);
      });
};
