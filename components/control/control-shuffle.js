const logger = require('/opt/utils/util-logger');
const {shuffle} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {sleep} = require('/opt/utils/util-timeout');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {responseUpdate} = require('/opt/control-panel/control-panel');

const SHUFFLE_RESPONSE = {
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  cannot: ':information_source: Spotify cannot toggle shuffling right now.',
  fail: ':warning: Spotify failed to toggle shuffle on the playlist.',
  on: (userId) => `:information_source: Shuffle was enabled by <@${userId}>.`,
  off: (userId) => `:information_source: Shuffle was disabled by <@${userId}>.`,
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, timestamp} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const status = await fetchCurrentPlayback(teamId, channelId );
    // Spotify is not playing
    if (!status.device) {
      return await responseUpdate(teamId, channelId, timestamp, false, SHUFFLE_RESPONSE.not_playing, status);
    }
    if (status.actions && status.actions.disallows && status.actions.disallows.toggling_shuffle) {
      return await responseUpdate(teamId, channelId, timestamp, false, SHUFFLE_RESPONSE.cannot, status);
    }

    if (status.shuffle_state) {
      // Turn off shuffle
      await shuffle(teamId, channelId, false);
      await sleep(400);
      return await responseUpdate(teamId, channelId, timestamp, true, SHUFFLE_RESPONSE.off(userId), null);
    } else {
      // Turn on Shuffle
      await shuffle(teamId, channelId, true);
      await sleep(400);
      return await responseUpdate(teamId, channelId, timestamp, true, SHUFFLE_RESPONSE.on(userId), null);
    }
  } catch (error) {
    logger.error(error);
    logger.error('Failed to toggle shuffle');
    try {
      return await responseUpdate(teamId, channelId, timestamp, false, SHUFFLE_RESPONSE.fail, null);
    } catch (error) {
      logger.error(error);
      logger.error('Failed to report control shuffle fail');
    }
  }
};
