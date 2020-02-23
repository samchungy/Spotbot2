const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);

const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {responseUpdate} = require('/opt/control-panel/control-panel');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
// const {loadBlacklist} = require('../settings/blacklist/blacklist-dal');
const {addVote, getSkipBlock, setSkip} = require('/opt/control-skip/control-skip');
const {changeSkip, loadSkip, storeSkip} = require('/opt/settings/settings-extra-interface');
const {modelSkip} = require('/opt/settings/settings-extra-model');
const {post} = require('/opt/slack/slack-api');
const {inChannelPost} = require('/opt/slack/format/slack-format-reply');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

const SKIP_VOTES = config.dynamodb.settings.skip_votes;
const SKIP_VOTES_AH = config.dynamodb.settings.skip_votes_ah;
const TIMEZONE = config.dynamodb.settings.timezone;

const SKIP_RESPONSE = {
  blacklist: (title, users) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} is on the blacklist and was skipped by ${SKIP_RESPONSE.users(users)}.`,
  confirmation: (title, users) => `:black_right_pointing_double_triangle_with_vertical_bar: ${title} was skipped by ${SKIP_RESPONSE.users(users)}.`,
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  failed: ':warning: Skip Failed.',
  request: (userId, title) => `:black_right_pointing_double_triangle_with_vertical_bar: Skip Request:\n\n <@${userId}> has requested to skip ${title}`,
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    // Get current playback status
    let skipVotes;
    const auth = await authSession(teamId, channelId);
    const {country} = auth.getProfile();
    const status = await fetchCurrentPlayback(teamId, channelId, auth, country);

    // Spotify is not playing anything so we cannot skip
    if (!status.device || !status.item) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, SKIP_RESPONSE.not_playing, status);
    }

    const statusTrack = new Track(status.item);

    // const blacklist = await loadBlacklist(teamId, channelId);
    // if (blacklist.find((track) => statusTrack.uri === track.uri)) {
    //   await skip(teamId, channelId );
    //   await post(
    //       inChannelPost(channelId, SKIP_RESPONSE.blacklist(statusTrack.title, [userId])),
    //   );
    //   return await responseUpdate(teamId, channelId, auth, settings, timestamp, true, null, null);
    // }


    // See if there is an existing skip request
    const currentSkip = await loadSkip(teamId, channelId);
    if (currentSkip && currentSkip.skip && currentSkip.skip.track.id == statusTrack.id) {
      // If so - Add Vote to Skip
      return await addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack);
    }

    // If Time is before 6am or after 6pm local time.
    const timezone = settings[TIMEZONE];
    const now = moment().tz(timezone);
    const currentDay = now.format('YYYY-MM-DD');
    if (now.isBefore(moment.tz(`${currentDay} 06:00`, timezone)) || now.isAfter(moment.tz(`${currentDay} 18:00`, timezone))) {
      skipVotes = parseInt(settings[SKIP_VOTES_AH]);
    } else {
      skipVotes = parseInt(settings[SKIP_VOTES]);
    }
    // Skip threshold is 0
    if (!skipVotes) {
      // Store skip for blacklist
      await Promise.all([
        setSkip(teamId, channelId, auth, statusTrack, currentSkip),
        post(
            inChannelPost(channelId, SKIP_RESPONSE.confirmation(statusTrack.title, [userId])),
        ),
      ]);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, true, null, null);
    }

    // else Generate a skip request
    const skipBlock = getSkipBlock(userId, skipVotes, statusTrack.title, statusTrack.id, [userId]);
    const slackPost = await post(
        inChannelPost(channelId, SKIP_RESPONSE.request(userId, statusTrack.title), skipBlock),
    );
    // Store skip with the message timestamp so that we can update the message later
    const model = modelSkip(slackPost.message.ts, timestamp, statusTrack, [userId], skipVotes, null);
    if (currentSkip) {
      await changeSkip(teamId, channelId, Object.entries(model)
          .map(([key, value]) => {
            return {key: key, value: value};
          }));
    } else {
      await storeSkip(teamId, channelId, model);
    }
    if (timestamp) {
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, true, null, null);
    }
  } catch (error) {
    logger.error(error);
    logger.error('Starting Skip failed');
    try {
      const auth = await authSession(teamId, channelId);
      return await responseUpdate(teamId, channelId, auth, settings, timestamp, false, SKIP_RESPONSE.failed, null);
    } catch (error2) {
      logger.error(error2);
      logger.error('Failed to report skip fail');
    }
  }
};
