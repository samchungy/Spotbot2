const config = require(process.env.CONFIG);
const {loadSetting, storeSetting} = require('./settings-dal');

const SETTINGS = config.dynamodb.settings;
const SETTINGS_EXTRA = config.dynamodb.settings_extra;

// Functions for other modules to use
const loadAdmins = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS.channel_admins);
const loadBackToPlaylist = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS.back_to_playlist);
const loadBackToPlaylistState = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.back_to_playlist_state);
const loadDefaultDevice = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS.default_device);
const loadPlaylist = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS.playlist);
const loadProfile = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS_EXTRA.profile);
const loadRepeat = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS.disable_repeats_duration);
const loadSkipVotes = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS.skip_votes);
const loadSkipVotesAfterHours = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS.skip_votes_ah);
const loadTimezone = (teamId, channelId) => loadSetting(teamId, channelId, SETTINGS.timezone);
const storeBackToPlaylistState = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS_EXTRA.back_to_playlist_state, value);
const storeDefaultDevice = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS.default_device, value);
const storePlaylist = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS.playlist, value);
const storeProfile = (teamId, channelId, value) => storeSetting(teamId, channelId, SETTINGS_EXTRA.profile, value);

module.exports = {
  loadAdmins,
  loadBackToPlaylist,
  loadBackToPlaylistState,
  loadDefaultDevice,
  loadPlaylist,
  loadProfile,
  loadRepeat,
  loadSkipVotes,
  loadSkipVotesAfterHours,
  loadTimezone,
  storeBackToPlaylistState,
  storeDefaultDevice,
  storePlaylist,
  storeProfile,
};
