const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');

// Spotify
const {fetchPlaylists} = require('/opt/spotify/spotify-api-v2/spotify-api-playlists');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');

// Settings
const {modelPlaylist, storePlaylists} = require('/opt/db/settings-interface');

// Slack
const {option, optionGroup} = require('/opt/slack/format/slack-format-modal');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const LIMIT = config.spotify_api.playlists.limit;
const SETTINGS_HELPER = config.dynamodb.settings_helper;
const NEW_PLAYLIST = SETTINGS_HELPER.create_new_playlist;
const PLAYLIST = config.dynamodb.settings.playlist;

const RESPONSE = {
  failed: 'Fetching Spotify playlists in settings failed',
};

const fetchAllPlaylists = async (teamId, channelId, auth, count=0) => {
  const playlists = await fetchPlaylists(auth, count, LIMIT);
  if (playlists.total > ((count+1) * LIMIT)) {
    return [...playlists.items, ...(await fetchAllPlaylists(teamId, channelId, auth, count+1))];
  } else {
    return playlists.items;
  }
};

/**
 * Fetch all compatible Spotify playlists
 * @param {string} teamId
 * @param {string} channelId
 * @param {modelPlaylist} currentPlaylist
 */
const getCompatiblePlaylists = async (teamId, channelId, currentPlaylist) => {
  const auth = await authSession(teamId, channelId);
  const profile = auth.getProfile();
  const allPlaylists = await fetchAllPlaylists(teamId, channelId, auth);
  return [
    ...currentPlaylist ? [currentPlaylist] : [],
    ...allPlaylists // Filter out curerntPlaylist to avoid dupes, and keep only playlists user owns, or collaborative ones
        .filter((playlist) => (!currentPlaylist || (playlist.id != currentPlaylist.id)) && (playlist.collaborative == true || playlist.owner.id == profile.id))
        .map((playlist) => modelPlaylist(playlist)),
  ];
};

const main = async (teamId, channelId, settings, query) => {
  const currentPlaylist = settings ? settings[PLAYLIST] : null;
  // Convert our saved setting to a Slack option, adds a create new playlist option
  const other = [
    ...currentPlaylist ? [option(`${currentPlaylist.name} (Current Selection)`, `${currentPlaylist.id}`)] : [],
    option(`Create a new playlist called "${query}"`, `${NEW_PLAYLIST}${query}`),
  ];
  const playlists = await getCompatiblePlaylists(teamId, channelId, currentPlaylist);
  await storePlaylists(teamId, channelId, {value: playlists}, moment().add(1, 'hour').unix());
  // Converts into Slack Option if it matches the search query
  const searchPlaylists = playlists
      .filter((playlist) => playlist.name.toLowerCase().includes(query.toLowerCase()))
      .map((playlist) => option(playlist.name, playlist.id));

  if (!searchPlaylists.length) {
    return {
      option_groups: [optionGroup(`No query results for "${query}"`, other)],
    };
  }
  return {
    option_groups: [
      optionGroup('Search Results:', searchPlaylists.slice(0, 99)),
      optionGroup('Other:', other),
    ],
  };
};

module.exports.handler = async (event, context) => {
  // LAMBDA FUNCTION
  const {teamId, channelId, userId, settings, query} = event;
  return await main(teamId, channelId, settings, query)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, RESPONSE.failed);
      });
};
