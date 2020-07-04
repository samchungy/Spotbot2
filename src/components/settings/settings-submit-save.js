const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Settings
const {changeSettings, modelDevice, modelPlaylist, loadDevices, loadPlaylists, loadSettings} = require('/opt/db/settings-interface');

// Slack
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {postEphemeral} = require('/opt/slack/slack-api');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Spotify
const {createPlaylist} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {removeState} = require('/opt/db/spotify-auth-interface');

// Util
const {isEqual, isEmpty} = require('/opt/utils/util-objects');

const SETTINGS = config.dynamodb.settings;
const SETTINGS_HELPER = config.dynamodb.settings_helper;
const NEW_PLAYLIST = SETTINGS_HELPER.create_new_playlist;
const NEW_PLAYLIST_REGEX = new RegExp(`^${NEW_PLAYLIST}`);

const SETTINGS_RESPONSE = {
  failed: 'Settings failed to save',
  success: ':white_check_mark: Settings successfully saved.',
};

/**
 * Transform our value from the Submission into a setting to store
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} attribute
 * @param {string} newValue
 * @param {string} oldValue
 */
const transformValue = async (teamId, channelId, attribute, newValue, oldValue) => {
  switch (attribute) {
    case SETTINGS.playlist:
      newValue = await getPlaylistValue(teamId, channelId, newValue, oldValue);
      break;
    case SETTINGS.default_device:
      newValue = await getDeviceValue(teamId, channelId, newValue, oldValue);
      break;
  }
  return newValue;
};

/**
 * Get the playlist value from our playlists fetch
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} newValue
 * @param {string} oldValue
 */
const getPlaylistValue = async (teamId, channelId, newValue, oldValue) => {
  if (oldValue && oldValue.id === newValue) {
    return oldValue;
  }
  const auth = await authSession(teamId, channelId);
  const profile = auth.getProfile();
  if (newValue.includes(NEW_PLAYLIST)) {
    newValue = newValue.replace(NEW_PLAYLIST_REGEX, '');
    // Create a new playlist using Spotify API
    const newPlaylist = await createPlaylist(teamId, channelId, auth, profile.id, newValue);
    return modelPlaylist(newValue, newPlaylist.id, newPlaylist.uri, newPlaylist.external_urls.spotify);
  } else {
    // Grab the playlist object from our earlier Database playlist fetch
    const {value: playlists} = await loadPlaylists(teamId, channelId);
    return playlists.find((playlist) => playlist.id === newValue);
  }
};

/**
 * Get the device value from devices fetch
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} newValue
 * @param {string} oldValue
 */
const getDeviceValue = async (teamId, channelId, newValue, oldValue) => {
  switch (newValue) {
    case (oldValue ? oldValue.id : null):
      return oldValue;
    case SETTINGS_HELPER.no_devices:
      return modelDevice(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices);
    default: {
      const {value: spotifyDevices} = await loadDevices(teamId, channelId);
      return spotifyDevices.find((device) => device.id === newValue);
    }
  }
};

const saveSettings = async (teamId, channelId, userId, submissions) => {
  const dbSettings = await loadSettings(teamId, channelId);
  const settings = {
    ...dbSettings ? dbSettings : SETTINGS, // Load settings or load default settings
  };

  const newSettings = await Object.keys(settings).reduce(async (submit, key) => {
    const acc = await submit;
    const oldValue = settings[key];
    const newValue = await transformValue(teamId, channelId, key, submissions[key], oldValue);
    if (!dbSettings || !isEqual(oldValue, newValue)) {
      acc[key] = newValue;
    }
    return acc;
  }, {});
  const message = ephemeralPost(channelId, userId, SETTINGS_RESPONSE.success, null);

  await Promise.all([
    ...!isEmpty(newSettings) ? [changeSettings(teamId, channelId, newSettings)] : [],
    removeState(teamId, channelId), // DELETE STATE
    postEphemeral(message), // Report back to Slack
  ]);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, submissions} = JSON.parse(event.Records[0].Sns.Message);
  await saveSettings(teamId, channelId, userId, submissions)
      .catch((error)=>{
        logger.error(error, SETTINGS_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, SETTINGS_RESPONSE.failed);
      });
};
