
const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');

// Slack
const {reply, updateModal} = require('/opt/slack/slack-api');
const {deleteReply} = require('/opt/slack/format/slack-format-reply');
const {textSection} = require('/opt/slack/format/slack-format-blocks');
const {option, optionGroup, multiSelectStaticGroups, slackModal, selectStatic, yesOrNo} = require('/opt/slack/format/slack-format-modal');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Spotify
const {fetchPlaylistTotal} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const authSession = require('/opt/spotify/spotify-auth/spotify-auth-session');

// Reset
const {getReviewTracks} = require('./layers/control-reset');

const RESET_MODAL = config.slack.actions.reset_modal;
const REVIEW_JUMP = config.slack.actions.reset_review_jump;
const PLAYLIST = config.dynamodb.settings.playlist;

const RESET_RESPONSE = {
  failed: 'Opening a reset review failed',
  empty: ':information_source: Playlist is already empty.',
  error: ':warning: An error occured.',
  kept: (trackUris) => ` ${trackUris.length} ${trackUris.length > 1 ? `tracks` : `track`} from the past 30 minutes ${trackUris.length > 1 ? `were` : `was`} kept.`,
  review_title: (numTracks) => `*${numTracks}* ${numTracks > 1 ? `tracks were` : `track was`} added in the past 30 minutes. Are you sure you want to remove ${numTracks > 1 ? `them` : `it`}?  Closing this window will keep none.`,
  success: (userId) => `:put_litter_in_its_place: The Spotbot playlist was reset by <@${userId}>`,
};

/**
 * Get review blocks
 * @param {Array} playlistTracks
 * @return {Object} reviewBlocks
 */
const getReviewBlocks = (playlistTracks) => {
  const buckets = {ten: [], twenty: [], thirty: []};
  const initialOptions = [];
  const tenMinutes = moment().subtract(10, 'minutes');
  const twentyMinutes = moment().subtract(20, 'minutes');
  // Sort into time buckets
  playlistTracks.forEach((track) => {
    const op = option(track.title, track.uri);
    if (moment(track.addedAt).isSameOrAfter(tenMinutes)) {
      initialOptions.push(op);
      buckets.ten.push(op);
    } else if (moment(track.addedAt).isSameOrAfter(twentyMinutes)) {
      buckets.twenty.push(op);
    } else {
      buckets.thirty.push(op);
    }
  });

  const groups = [];
  Object.keys(buckets).forEach((key) => {
    if (buckets[key].length) {
      switch (key) {
        case `ten`:
          groups.push(optionGroup(`Added less than 10 minutes ago`, buckets[key]));
          break;
        case `twenty`:
          groups.push(optionGroup(`Added less than 20 minutes ago`, buckets[key]));
          break;
        default:
          groups.push(optionGroup(`Added less than 30 minutes ago`, buckets[key]));
          break;
      }
    }
  });
  const blocks = [
    textSection(RESET_RESPONSE.review_title(playlistTracks.length)),
    multiSelectStaticGroups(RESET_MODAL, `Select songs to keep on the playlist`, `Tracks added in the past 10 minutes have been pre-selected.`, initialOptions.length ? initialOptions : null, groups, true),
    selectStatic(REVIEW_JUMP, `Jump to the start of the playlist?`, `This will only work if a track is selected above.`, option(`Yes`, 'true'), yesOrNo()),
  ];
  return blocks;
};

const openResetReview = async (teamId, channelId, settings, viewId, responseUrl) => {
  // Delete review confirmation block
  const message = deleteReply('', null);
  await reply(message, responseUrl);
  const auth = await authSession(teamId, channelId);
  const playlist = settings[PLAYLIST];
  const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, auth, playlist.id);
  const reviewTracks = await getReviewTracks(teamId, channelId, auth, playlist, total);
  const blocks = getReviewBlocks(reviewTracks);
  const metadata = channelId;
  const view = slackModal(RESET_MODAL, `Reset: Review Tracks`, `Confirm`, `Close`, blocks, true, metadata);
  await updateModal(viewId, view);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, viewId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  await openResetReview(teamId, channelId, settings, viewId, responseUrl)
      .catch((error)=>{
        logger.error(error, RESET_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, RESET_RESPONSE.failed);
      });
};

