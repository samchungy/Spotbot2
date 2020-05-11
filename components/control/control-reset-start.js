const sns = require('/opt/sns');


const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {getReviewTracks} = require('./layers/control-reset');
const {fetchPlaylistTotal} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {actionSection, buttonActionElement, textSection} = require('/opt/slack/format/slack-format-blocks');
const {postEphemeral} = require('/opt/slack/slack-api');
const {responseUpdate} = require('/opt/control-panel/control-panel');

const PLAYLIST = config.dynamodb.settings.playlist;
const BUTTON = config.slack.buttons;
const RESET_REVIEW_CONFIRM = config.slack.actions.reset_review_confirm;
const RESET_REVIEW_DENY = config.slack.actions.reset_review_deny;
const CONTROL_RESET_SET = process.env.SNS_PREFIX + 'control-reset-set';

const RESET_RESPONSE = {
  empty: ':information_source: Playlist is already empty.',
  error: ':warning: An error occured.',
  review: (numTracks) => `:rotating_light: Hold up! *${numTracks}* ${numTracks > 1 ? `tracks were` : `track was`} added in the past 30 minutes. Would you like to keep ${numTracks > 1 ? `some of them?` : `it?`}`,
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const auth = await authSession(teamId, channelId);
    const playlist = settings[PLAYLIST];
    const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, auth, playlist.id);
    if (!total) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, RESET_RESPONSE.empty, null);
    }
    const reviewTracks = await getReviewTracks(teamId, channelId, auth, playlist, total);
    if (reviewTracks.length) {
      const value = JSON.stringify({channelId: channelId, timestamp: timestamp});
      const confirmBlocks = [
        textSection(RESET_RESPONSE.review(reviewTracks.length)),
        actionSection(RESET_REVIEW_CONFIRM, [
          buttonActionElement(RESET_REVIEW_CONFIRM, `Review Tracks`, value, false, BUTTON.primary),
          buttonActionElement(RESET_REVIEW_DENY, `Remove Tracks`, value, false, BUTTON.danger),
        ]),
      ];
      await postEphemeral(
          ephemeralPost(channelId, userId, RESET_RESPONSE.review(reviewTracks.length), confirmBlocks),
      );
      // // We have tracks to review, send a modal
      // const blocks = getReviewBlocks(reviewTracks);
      // const metadata = JSON.stringify({teamId: teamId, playlistId: playlist.id, channelId, timestamp, offset: total-LIMIT});
      // const view = slackModal(REVIEW, `Reset: Review Tracks`, `Confirm`, `Close`, blocks, true, metadata);
      // await sendModal(triggerId, view);
      return;
    } else {
      // reset
      const params = {
        Message: JSON.stringify({teamId, channelId, settings, timestamp, trackUris: null, userId}),
        TopicArn: CONTROL_RESET_SET,
      };
      await sns.publish(params).promise();
    }
  } catch (error) {
    logger.error('Control reset failed');
    logger.error(error);
    try {
      const auth = await authSession(teamId, channelId);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, RESET_RESPONSE.error, null);
    } catch (error) {
      logger.error('Reporting back to Slack failed');
      logger.error(error);
    }
  }
};
