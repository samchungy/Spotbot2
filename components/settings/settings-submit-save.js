const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

const {changeSettings, loadSettings, storeSettings} = require('/opt/settings/settings-interface');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {postEphemeral} = require('/opt/slack/slack-api');
const {isEqual, isEmpty} = require('/opt/utils/util-objects');

// Transform Device and Playlist values
const {loadDevices, loadPlaylists} = require('/opt/settings/settings-helper');
const {modelDevice, modelPlaylist} = require('/opt/settings/settings-model');
const {createPlaylist} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {removeState} = require('/opt/spotify/spotify-auth/spotify-auth-interface');

const SETTINGS = config.dynamodb.settings;
const SETTINGS_HELPER = config.dynamodb.settings_helper;
const NEW_PLAYLIST = SETTINGS_HELPER.create_new_playlist;
const NEW_PLAYLIST_REGEX = new RegExp(`^${NEW_PLAYLIST}`);

const SETTINGS_RESPONSE = {
  success: ':white_check_mark: Settings successfully saved.',
  fail: ':x: Something went wrong! Settings were not saved.',
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, submissions} = JSON.parse(event.Records[0].Sns.Message);
  try {
    // No Errors - proceed with saving the settings
    const dbSettings = await loadSettings(teamId, channelId);
    let settings;
    if (!dbSettings) {
      // Create a default set of values
      settings = {...SETTINGS};
      Object.keys(settings).forEach((key) => settings[key] = null);
    } else {
      settings = {...dbSettings};
    }
    for (const key in settings) {
      if ({}.hasOwnProperty.call(settings, key)) {
        const oldValue = settings[key];
        let newValue = submissions[key];
        // Some settings need extra values saved alongside the Slack submission payload.
        newValue = await transformValue(teamId, channelId, key, newValue, oldValue);
        // Save on unecessary Read/Writes
        if (isEqual(oldValue, newValue)) {
          delete settings[key];
        } else {
          settings[key] = newValue;
        }
      }
    }
    // Only save if we have something to update.
    if (!isEmpty(settings)) {
      // If new DB
      if (!dbSettings) {
        await storeSettings(teamId, channelId, settings);
      } else {
        await changeSettings(teamId, channelId, Object.entries(settings).map(([key, value]) => {
          return {key: key, value: value};
        }));
      }
    }

    // Report back to Slack
    await Promise.all([
      // DELETE STATE
      removeState(teamId, channelId),
      postEphemeral(
          ephemeralPost(channelId, userId, SETTINGS_RESPONSE.success, null),
      ),
    ]);
  } catch (error) {
    logger.error('Failed to save settings');
    logger.error(error);
    // Something in our Save Settings function failed.
    if (channelId) {
      try {
        await postEphemeral(
            ephemeralPost(channelId, userId, SETTINGS_RESPONSE.fail, null),
        );
      } catch (error) {
        logger.error('Failed to report save settings fail');
        logger.error(error);
      }
    }
  }
};

/**
 * Transform our value from the Submission into a setting to store
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} attribute
 * @param {string} newValue
 * @param {string} oldValue
 */
async function transformValue(teamId, channelId, attribute, newValue, oldValue) {
  switch (attribute) {
    case SETTINGS.playlist:
      newValue = await getPlaylistValue(teamId, channelId, newValue, oldValue);
      break;
    case SETTINGS.default_device:
      newValue = await getDeviceValue(teamId, channelId, newValue, oldValue);
      break;
  }
  return newValue;
}

/**
 * Get the playlist value from our playlists fetch
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} newValue
 * @param {string} oldValue
 */
async function getPlaylistValue(teamId, channelId, newValue, oldValue) {
  try {
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
  } catch (error) {
    logger.error('Converting Playlist Value failed');
    throw error;
  }
}

/**
 * Get the device value from devices fetch
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} newValue
 * @param {string} oldValue
 */
async function getDeviceValue(teamId, channelId, newValue, oldValue) {
  try {
    switch (newValue) {
      case (oldValue ? oldValue.id : null):
        return oldValue;
      case SETTINGS_HELPER.no_devices:
        return modelDevice(SETTINGS_HELPER.no_devices_label, SETTINGS_HELPER.no_devices);
      default:
        const {value: spotifyDevices} = await loadDevices(teamId, channelId);
        return spotifyDevices.find((device) => device.id === newValue);
    }
  } catch (error) {
    logger.error('Converting Device Value failed');
    throw error;
  }
}
