const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const sns = require('/opt/sns');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchPlaylistTotal} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');

// Slack
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {actionSection, buttonActionElement, textSection} = require('/opt/slack/format/slack-format-blocks');
const {postEphemeral, post} = require('/opt/slack/slack-api');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Reset
const {getReviewTracks} = require('./layers/control-reset');

const PLAYLIST = config.dynamodb.settings.playlist;
const BUTTON = config.slack.buttons;
const RESET_REVIEW_CONFIRM = config.slack.actions.reset_review_confirm;
const RESET_REVIEW_DENY = config.slack.actions.reset_review_deny;
const CONTROL_RESET_SET = process.env.SNS_PREFIX + 'control-reset-set';

const RESPONSE = {
  failed: 'Reset failed',
  empty: ':information_source: Playlist is already empty.',
  error: ':warning: An error occured.',
  review: (numTracks) => `:rotating_light: Hold up! *${numTracks}* ${numTracks > 1 ? `tracks were` : `track was`} added in the past 30 minutes. Would you like to keep ${numTracks > 1 ? `some of them?` : `it?`}`,
};

const main = async (teamId, channelId, settings, userId) => {
  const auth = await authSession(teamId, channelId);
  const playlist = settings[PLAYLIST];
  const {total} = await fetchPlaylistTotal(auth, playlist.id);

  if (!total) {
    const message = inChannelPost(channelId, RESPONSE.empty, null);
    return await post(message);
  }

  const reviewTracks = await getReviewTracks(auth, playlist, total);
  // Send review block
  if (reviewTracks.length) {
    const confirmBlocks = [
      textSection(RESPONSE.review(reviewTracks.length)),
      actionSection(RESET_REVIEW_CONFIRM, [
        buttonActionElement(RESET_REVIEW_CONFIRM, `Review Tracks`, channelId, false, BUTTON.primary),
        buttonActionElement(RESET_REVIEW_DENY, `Remove Tracks`, channelId, false, BUTTON.danger),
      ]),
    ];
    const message = ephemeralPost(channelId, userId, RESPONSE.review(reviewTracks.length), confirmBlocks);
    return await postEphemeral(message);
  }

  // Reset
  const params = {
    Message: JSON.stringify({teamId, channelId, settings, trackUris: null, userId}),
    TopicArn: CONTROL_RESET_SET,
  };
  await sns.publish(params).promise();
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, settings, userId)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
