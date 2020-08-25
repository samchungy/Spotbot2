const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {deleteTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const {fetchTracksInfo} = require('/opt/spotify/spotify-api-v2/spotify-api-tracks');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

// Slack
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {post} = require('/opt/slack/slack-api');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const REMOVE_MODAL = config.slack.actions.remove_modal;
const INFO_LIMIT = config.spotify_api.tracks.info_limit;
const PLAYLIST = config.dynamodb.settings.playlist;

const RESPONSE = {
  failed: 'Removing track failed',
  error: `:warning: An error occured. Please try again.`,
  removed: (trackNames) => `:put_litter_in_its_place: ${trackNames.join(', ')} ${trackNames.length > 1 ? `were`: `was`} removed from the playlist.`,
};

const extractSubmissions = (view) => {
  const values = view.state.values;
  return Object.entries(values).reduce((subs, [key, value]) => {
    switch (key) {
      case REMOVE_MODAL:
        subs = value[key].selected_options;
        break;
    }
    return subs;
  }, []) || [];
};

const main = async (teamId, channelId, settings, view) => {
  const playlist = settings[PLAYLIST];
  const auth = await authSession(teamId, channelId);
  const {country} = auth.getProfile();

  const submissions = extractSubmissions(view).map((track) => track.value);
  if (!submissions.length) {
    return;
  }

  // We grab it's info in case there is a re-linked URI.
  const allTrackInfoPromises = [];
  const attempts = Math.ceil(submissions.length/INFO_LIMIT);
  for (let attempt = 0; attempt < attempts; attempt++) {
    allTrackInfoPromises.push(fetchTracksInfo(auth, country, submissions.slice(attempt*INFO_LIMIT, (attempt+1)*INFO_LIMIT)));
  }

  // Extract Promise Info
  const allSpotifyTrackInfos = (await Promise.all(allTrackInfoPromises)).map((infoPromise) => infoPromise.tracks).flat();
  const trackInfos = allSpotifyTrackInfos.map((track) => {
    const trackObj = new Track(track);
    trackObj.uri = track.linked_from ? track.linked_from.uri : trackObj.uri; // Sometimes tracks are re-linked.
    return trackObj;
  });

  await deleteTracks(auth, playlist.id, trackInfos.map((track) => {
    return {
      uri: track.uri,
    };
  }));
  const message = inChannelPost(channelId, RESPONSE.removed(trackInfos.map((track) => track.title)), null);
  await post(message);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, view} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, settings, view)
      .catch(async (error)=>{
        logger.error(error, RESPONSE.failed);
        await reportErrorToSlack(channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
