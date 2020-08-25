const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {deleteTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');

// Slack
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {post} = require('/opt/slack/slack-api');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const REMOVE_MODAL = config.slack.actions.remove_modal;
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

  const submissions = extractSubmissions(view);
  if (!submissions.length) {
    return;
  }

  await deleteTracks(auth, playlist.id, submissions.map((track) => ({uri: track.value})));
  const message = inChannelPost(channelId, RESPONSE.removed(submissions.map((track) => track.text.text)), null);
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
