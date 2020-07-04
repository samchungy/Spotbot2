const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {deleteTracks} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {fetchTracksInfo} = require('/opt/spotify/spotify-api/spotify-api-tracks');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

// Slack
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {post} = require('/opt/slack/slack-api');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const REMOVE_MODAL = config.slack.actions.remove_modal;
const INFO_LIMIT = config.spotify_api.tracks.info_limit;
const PLAYLIST = config.dynamodb.settings.playlist;

const REMOVE_RESPONSES = {
  failed: 'Removing track failed',
  error: `:warning: An error occured. Please try again.`,
  removed: (trackNames) => `:put_litter_in_its_place: ${trackNames.join(', ')} ${trackNames.length > 1 ? `were`: `was`} removed from the playlist.`,
};

/**
 * Extract the results from the submitted Slack modal view
 * @param {object} view
 * @return {Array} Submission values
 */
const extractSubmissions = (view) => {
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
};

const removeSubmit = async (teamId, channelId, settings, userId, view) => {
  const playlist = settings[PLAYLIST];
  const auth = await authSession(teamId, channelId);
  const {country} = auth.getProfile();

  const submissions = extractSubmissions(view).map((track) => track.value.replace('spotify:track:', ''));
  if (!submissions.length) {
    return;
  }

  // We grab it's info in case there is a re-linked URI.
  const allTrackInfoPromises = [];
  const attempts = Math.ceil(submissions.length/INFO_LIMIT);
  for (let attempt = 0; attempt < attempts; attempt++) {
    allTrackInfoPromises.push(fetchTracksInfo(teamId, channelId, auth, country, submissions.slice(attempt*INFO_LIMIT, (attempt+1)*INFO_LIMIT)));
  }

  // Extract Promise Info
  const allSpotifyTrackInfos = (await Promise.all(allTrackInfoPromises)).map((infoPromise) => infoPromise.tracks).flat();
  const trackInfos = allSpotifyTrackInfos.map((track) => {
    const trackObj = new Track(track);
    trackObj.uri = track.linked_from ? track.linked_from.uri : trackObj.uri; // Sometimes tracks are re-linked.
    return trackObj;
  });

  await deleteTracks(teamId, channelId, auth, playlist.id, trackInfos.map((track) => {
    return {
      uri: track.uri,
    };
  }));
  const message = inChannelPost(channelId, REMOVE_RESPONSES.removed(trackInfos.map((track) => track.title)), null);
  await post(message);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, view} = JSON.parse(event.Records[0].Sns.Message);
  await removeSubmit(teamId, channelId, settings, userId, view)
      .catch((error)=>{
        logger.error(error, REMOVE_RESPONSES.failed);
        reportErrorToSlack(teamId, channelId, userId, REMOVE_RESPONSES.failed);
      });
};
