
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
const {fetchPlaylistTotal} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');

// Reset
const {getReviewTracks} = require('./layers/control-reset');

const RESET_MODAL = config.slack.actions.reset_modal;
const REVIEW_JUMP = config.slack.actions.reset_review_jump;
const PLAYLIST = config.dynamodb.settings.playlist;

const RESPONSE = {
  failed: 'Opening a reset review failed',
  empty: ':information_source: Playlist is already empty.',
  error: ':warning: An error occured.',
  review_title: (numTracks) => `*${numTracks}* ${numTracks > 1 ? `tracks were` : `track was`} added in the past 30 minutes. Are you sure you want to remove ${numTracks > 1 ? `them` : `it`}?  Closing this window will keep none.`,
};

const LABELS = {
  ten: `Added less than 10 minutes ago`,
  twenty: `Added less than 20 minutes ago`,
  thirty: `Added less than 30 minutes ago`,
  select: `Select songs to keep on the playlist`,
  preselect: `Tracks added in the past 10 minutes have been pre-selected.`,
  jump: `Jump to the start of the playlist?`,
  jump_desc: `This will only work if a track is selected above.`,
};

/**
 * Get review blocks
 * @param {Array} playlistTracks
 * @return {Object} reviewBlocks
 */
const getReviewBlocks = (playlistTracks) => {
  const tenMinutes = moment().subtract(10, 'minutes');
  const twentyMinutes = moment().subtract(20, 'minutes');
  // Sort into time buckets
  const buckets = playlistTracks.reduce((buckets, track) => {
    const op = option(track.title, track.uri);
    if (moment(track.addedAt).isSameOrAfter(tenMinutes)) {
      buckets.ten.push(op);
    } else if (moment(track.addedAt).isSameOrAfter(twentyMinutes)) {
      buckets.twenty.push(op);
    } else {
      buckets.thirty.push(op);
    }
    return buckets;
  }, {ten: [], twenty: [], thirty: []});

  const groups = Object.keys(buckets).reduce((groups, key) => {
    if (buckets[key].length) {
      switch (key) {
        case `ten`:
          groups.push(optionGroup(LABELS.ten, buckets[key]));
          break;
        case `twenty`:
          groups.push(optionGroup(LABELS.twenty, buckets[key]));
          break;
        default:
          groups.push(optionGroup(LABELS.thirty, buckets[key]));
          break;
      }
    }
    return groups;
  }, []);
  const blocks = [
    textSection(RESPONSE.review_title(playlistTracks.length)),
    multiSelectStaticGroups(RESET_MODAL, LABELS.select, LABELS.preselect, buckets.ten.length ? buckets.ten : null, groups, true),
    selectStatic(REVIEW_JUMP, LABELS.jump, LABELS.jump_desc, option(`Yes`, 'true'), yesOrNo()),
  ];
  return blocks;
};

const main = async (teamId, channelId, settings, viewId, responseUrl) => {
  // Delete review confirmation block
  const message = deleteReply('', null);
  reply(message, responseUrl).catch(logger.error);

  const auth = await authSession(teamId, channelId);
  const playlist = settings[PLAYLIST];
  const {total} = await fetchPlaylistTotal(auth, playlist.id);
  const reviewTracks = await getReviewTracks(auth, playlist, total);
  const blocks = getReviewBlocks(reviewTracks);
  const view = slackModal(RESET_MODAL, `Reset: Review Tracks`, `Confirm`, `Close`, blocks, true, channelId);
  await updateModal(viewId, view);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, viewId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, settings, viewId, responseUrl)
      .catch(async (error)=>{
        logger.error(error, RESPONSE.failed);
        await reportErrorToSlack(channelId, null, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
module.exports.LABELS = LABELS;

