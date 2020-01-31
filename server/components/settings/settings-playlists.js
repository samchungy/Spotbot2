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
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} query
 */
async function getAllPlaylists(teamId, channelId, query) {
  try {
    const currentPlaylist = await loadPlaylistSetting(teamId, channelId );
    const playlists = await allPlaylists(teamId, channelId, currentPlaylist);
    await storePlaylists(teamId, channelId, playlists);

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
        optionGroup('Search Results:', searchPlaylists.slice(0, 100)),
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
 * @param {string} teamId
 * @param {string} channelId
 * @param {modelPlaylist} currentPlaylist
 */
async function allPlaylists(teamId, channelId, currentPlaylist) {
  try {
    const compatiblePlaylists = [...currentPlaylist ? [currentPlaylist] : []];
    let count = 0;
    const profile = await loadProfile(teamId, channelId );
    while (true) {
      const playlists = await fetchPlaylists(teamId, channelId, count, LIMIT);
      // Only if it is a collaborative playlist or the owner is ourselves - a playlist compatible.
      // and current playlist is not in the list
      compatiblePlaylists.push(
          ...playlists.items
              .filter((playlist) => (!currentPlaylist || (playlist.id != currentPlaylist.id)) &&
                (playlist.collaborative == true || playlist.owner.id == profile.id))
              .map((playlist) => modelPlaylist(playlist.name, playlist.id, playlist.uri, playlist.external_urls.spotify)),
      );

      // See if we can get more playlists as the Spotify Limit is 50 playlists per call.
      if (playlists.total > ((count+1) * LIMIT)) {
        count++;
      } else {
        break;
      }
    }
    return compatiblePlaylists;
  } catch (error) {
    logger.error('Fetching all Spotify Playlists failed');
    throw error;
  }
}

/**
 * Get the playlist value from our playlists fetch
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} newValue
 */
async function getPlaylistValue(teamId, channelId, newValue) {
  try {
    if (newValue.includes(NEW_PLAYLIST)) {
      newValue = newValue.replace(NEW_PLAYLIST_REGEX, '');
      // Create a new playlist using Spotify API
      const spotifyId = await loadProfile(teamId, channelId );
      const newPlaylist = await createPlaylist(teamId, channelId, spotifyId, newValue);
      return modelPlaylist(newValue, newPlaylist.id, newPlaylist.uri, newPlaylist.external_urls.spotify);
    } else {
      // Grab the playlist object from our earlier Database playlist fetch
      const playlists = await loadPlaylists(teamId, channelId );
      return playlists.find((playlist) => playlist.id === newValue);
    }
  } catch (error) {
    logger.error('Converting Playlist Value failed');
    throw error;
  }
}

module.exports = {
  getAllPlaylists,
  allPlaylists,
  getPlaylistValue,
};
