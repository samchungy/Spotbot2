const config = require('config');
const logger = require('../../util/util-logger');
const {loadPlaylistSetting, loadPlaylists, storePlaylists} = require('./settings-dal');
const {modelPlaylist} = require('./settings-model');
const {createPlaylist, fetchPlaylists} = require('../spotify-api/spotify-api-playlists');
const {loadProfile} = require('./settings-dal');
const {option, optionGroup} = require('../slack/format/slack-format-modal');

const LIMIT = config.get('spotify_api.playlists.limit');
const SETTINGS_HELPER = config.get('dynamodb.settings_helper');
const NEW_PLAYLIST = SETTINGS_HELPER.create_new_playlist;
const NEW_PLAYLIST_REGEX = new RegExp(`^${NEW_PLAYLIST}`);

/**
 * Get all playlists based on a query query
 * @param {string} query
 */
async function getAllPlaylists(query) {
  try {
    const currentPlaylist = await loadPlaylistSetting();
    const playlists = await fetchAllPlaylists(currentPlaylist);
    await storePlaylists(playlists);

    // Converts into Slack Option if it matches the search query
    const searchPlaylists = playlists
        .filter((playlist) => playlist.name.toLowerCase().includes(query.toLowerCase()))
        .map((playlist) => option(playlist.name, playlist.id));

    const other = [
      ...currentPlaylist ? [option(`${currentPlaylist.name} (Current Selection)`, `${currentPlaylist.id}`)] : [],
      option(`Create a new playlist called "${query}"`, `${NEW_PLAYLIST}${query}`),
    ];

    if (!searchPlaylists.length) {
      return {
        option_groups: [optionGroup(`No query results for "${query}"`, other)],
      };
    }

    return {
      option_groups: [
        optionGroup('Search Results:', searchPlaylists),
        optionGroup('Other:', other),
      ],
    };
  } catch (error) {
    logger.error('Getting all Spotify playlists failed');
    throw error;
  }
}

/**
 * Fetch all compatible Spotify playlists
 * @param {modelPlaylist} currentPlaylist
 */
async function fetchAllPlaylists(currentPlaylist) {
  try {
    const compatiblePlaylists = [...currentPlaylist ? [currentPlaylist] : []];
    let count = 0;
    const profile = await loadProfile();
    while (true) {
      const playlists = await fetchPlaylists(count, LIMIT);

      // Only if it is a collaborative playlist or the owner is ourselves - a playlist compatible.
      compatiblePlaylists.push(
          ...playlists.items
              .filter((playlist) => playlist.id != currentPlaylist.id && (playlist.collaborative == true || playlist.owner.id == profile.id))
              .map((playlist) => modelPlaylist(playlist.name, playlist.id, playlist.external_urls.spotify)),
      );

      // See if we can get more playlists as the Spotify Limit is 50 playlists per call.
      if (playlists.total > (count+1) * LIMIT) {
        count++;
      } else {
        break;
      }
    }
    return compatiblePlaylists.slice(0, 100);
  } catch (error) {
    logger.error('Fetching all Spotify Playlists failed');
    throw error;
  }
}

/**
 * Get the playlist value from our playlists fetch
 * @param {string} newValue
 */
async function getPlaylistValue(newValue) {
  try {
    if (newValue.includes(NEW_PLAYLIST)) {
      newValue = newValue.replace(NEW_PLAYLIST_REGEX, '');
      // Create a new playlist using Spotify API
      const spotifyId = await loadProfile();
      const newPlaylist = await createPlaylist(spotifyId, newValue);
      return modelPlaylist(newValue, newPlaylist.id, newPlaylist.external_urls.spotify);
    } else {
      // Grab the playlist object from our earlier Database playlist fetch
      const playlists = await loadPlaylists();
      return playlists.find((playlist) => playlist.id === newValue);
    }
  } catch (error) {
    logger.error('Converting Playlist Value failed');
    throw error;
  }
}

module.exports = {
  getAllPlaylists,
  fetchAllPlaylists,
  getPlaylistValue,
};
