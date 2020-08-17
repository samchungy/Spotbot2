const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');

// Spotify
const {isPlaying} = require('/opt/spotify/spotify-helper');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

// Slack
const {post} = require('/opt/slack/slack-api');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');

// Skip
const {addVote, getSkipBlock, onBlacklist, skipTrack} = require('/opt/control-skip/control-skip');
const {createNewSkip, loadSkip} = require('/opt/db/settings-extra-interface');

const PLAYLIST = config.dynamodb.settings.playlist;
const SKIP_VOTES = config.dynamodb.settings.skip_votes;
const SKIP_VOTES_AH = config.dynamodb.settings.skip_votes_ah;
const TIMEZONE = config.dynamodb.settings.timezone;

const RESPONSE = {
  confirmation: (title, users) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} was skipped by ${RESPONSE.users(users)}.`,
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  failed: 'Skip Failed',
  request: (userId, title) => `:black_right_pointing_double_triangle_with_vertical_bar: Skip Request:\n\n <@${userId}> has requested to skip ${title}`,
  users: (users) => `${users.map((user) => `<@${user}>`).join(', ')}`,
};

const createSkipVote = async (teamId, channelId, userId, statusTrack, extraVotesNeeded, totalVotes) => {
  // else Generate a skip request
  const skipBlock = getSkipBlock(userId, extraVotesNeeded, statusTrack.title, statusTrack.id, [userId]);
  const message = inChannelPost(channelId, RESPONSE.request(userId, statusTrack.title), skipBlock);
  const slackPost = await post(message);
  await createNewSkip(teamId, channelId, slackPost.message.ts, statusTrack, [userId], totalVotes);
};

const isAfterHours = (timezone) => {
  const now = moment().tz(timezone);
  const currentDay = now.format('YYYY-MM-DD');
  return (now.isBefore(moment.tz(`${currentDay} 06:00`, timezone)) || now.isAfter(moment.tz(`${currentDay} 18:00`, timezone)));
};

const main = async (teamId, channelId, settings, userId) => {
  const playlist = settings[PLAYLIST];
  const auth = await authSession(teamId, channelId);
  const {country} = auth.getProfile();
  const status = await fetchCurrentPlayback(auth, country);

  // Check if Spotify is playing first
  if (!isPlaying(status)) {
    const message = inChannelPost(channelId, RESPONSE.not_playing);
    return await post(message);
  }

  // Check Blacklist for track
  const statusTrack = new Track(status.item);
  if (await onBlacklist(teamId, channelId, auth, settings, playlist, status, statusTrack)) {
    return;
  }

  // Check db for existing skip to add vote to
  const currentSkip = await loadSkip(teamId, channelId);
  if (currentSkip && currentSkip.skip && currentSkip.skip.track.id === statusTrack.id) {
    return addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack);
  }

  // Check db for number of votes required to skip
  const extraVotesNeeded = isAfterHours(settings[TIMEZONE]) ? parseInt(settings[SKIP_VOTES_AH]) : parseInt(settings[SKIP_VOTES]);
  if (!extraVotesNeeded) {
    // Skip!
    const message = inChannelPost(channelId, RESPONSE.confirmation(statusTrack.title, [userId]));
    return Promise.all([
      skipTrack(teamId, channelId, auth, settings, statusTrack),
      post(message),
    ]);
  }
  const totalVotes = extraVotesNeeded + 1; // Add 1 for person who requested skip
  return createSkipVote(teamId, channelId, userId, statusTrack, extraVotesNeeded, totalVotes);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, settings, userId)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
