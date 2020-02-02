const config = require('config');
const logger = require('../../util/util-logger');
const moment = require('moment-timezone');
const {loadSettings} = require('../settings/settings-dal');
const {multiSelectUsers, option, selectExternal, selectStatic, textInput, yesOrNo} = require('../slack/format/slack-format-modal');
const LIMITS = config.get('settings.limits');
const QUERY = config.get('settings.query_lengths');
const DB = config.get('dynamodb.settings');

const HINTS = {
  back_to_playlist: 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).',
  channel_admins: 'Admins can use Spotbot admin commands within this channel and modify it\'s settings.',
  default_device: 'This helps Spotbot with playing. Turn on your Spotify device now.',
  disable_repeats_duration: 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.',
  playlist: 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.',
  skip_votes: 'The number of additional votes needed to skip a song. Integers only',
  timezone: 'This is to configure the time based skip votes. Type in a location.',
  skip_votes_ah: 'The number of additional votes needed to skip a song. Integers only',
};

const LABELS = {
  back_to_playlist: 'Jump Back to Playlist',
  channel_admins: 'Channel Admins',
  default_device: 'Default Spotify Device',
  disable_repeats_duration: 'Disable Repeats Duration (Hours)',
  playlist: 'Spotbot Playlist',
  skip_votes: 'Skip Votes',
  skip_votes_ah: 'Skip Votes - After Hours (6pm-6am)',
  timezone: 'Timezone',
};

const PLACE = {
  default_device: 'Pick an option',
  disable_repeats_duration: 'Enter a number eg. 4',
  playlist: 'Type a playlist name',
  skip_votes: 'Enter a number eg. 2',
  skip_votes_ah: 'Enter a number eg. 0',
  timezone: 'Type to find your timezone',
};

/**
 * Loads old config and returns setting blocks
 * @param {string} teamId
 * @param {string} channelId
 */
async function getSettingsBlocks(teamId, channelId ) {
  try {
    const settings = await loadSettings(teamId, channelId );
    return [
      multiSelectUsers(DB.channel_admins, LABELS.channel_admins, HINTS.channel_admins, settings.channel_admins),
      selectExternal(DB.playlist, LABELS.playlist, HINTS.playlist, settings.playlist ? option(settings.playlist.name, settings.playlist.id) : null, QUERY.playlist, PLACE.playlist),
      selectExternal(DB.default_device, LABELS.default_device, HINTS.default_device, settings.default_device ? option(settings.default_device.name, settings.default_device.id) : null, QUERY.default_device, PLACE.default_device),
      textInput(DB.disable_repeats_duration, LABELS.disable_repeats_duration, HINTS.disable_repeats_duration, settings.disable_repeats_duration, LIMITS.disable_repeats_duration, PLACE.disable_repeats_duration),
      selectStatic(DB.back_to_playlist, LABELS.back_to_playlist, HINTS.back_to_playlist, settings.back_to_playlist ? setYesOrNo(settings.back_to_playlist) : null, yesOrNo()),
      selectExternal(DB.timezone, LABELS.timezone, HINTS.timezone, settings.timezone ? option(`${settings.timezone} (${moment().tz(settings.timezone).format('Z')})`, settings.timezone) : null, QUERY.timezone, PLACE.timezone),
      textInput(DB.skip_votes, LABELS.skip_votes, HINTS.skip_votes_ah, settings.skip_votes, LIMITS.skip_votes, PLACE.skip_votes),
      textInput(DB.skip_votes_ah, LABELS.skip_votes_ah, HINTS.skip_votes_ah, settings.skip_votes_ah, LIMITS.skip_votes, PLACE.skip_votes_ah),
    ];
  } catch (error) {
    logger.error('Getting Settings Blocks Failed');
    throw error;
  }
}

/**
 * Returns a Yes or No option based on a value
 * @param {string} value
 * @return {option} Yes or No option
 */
function setYesOrNo(value) {
  if (value == `true`) {
    return option(`Yes`, `true`);
  } else {
    return option(`No`, `false`);
  }
}

module.exports = {
  getSettingsBlocks,
};
