const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);
const {fetchPlaylists} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {storePlaylists} = require('/opt/settings/settings-interface');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {modelPlaylist} = require('/opt/settings/settings-model');
const {option, optionGroup} = require('/opt/slack/format/slack-format-modal');

const LIMIT = config.spotify_api.playlists.limit;
const SETTINGS_HELPER = config.dynamodb.settings_helper;
const NEW_PLAYLIST = SETTINGS_HELPER.create_new_playlist;
const PLAYLIST = config.dynamodb.settings.playlist;

/**
 * Fetch all compatible Spotify playlists
 * @param {string} teamId
 * @param {string} channelId
 * @param {modelPlaylist} currentPlaylist
 */
async function getCompatiblePlaylists(teamId, channelId, currentPlaylist) {
  try {
    const auth = await authSession(teamId, channelId);
    const profile = auth.getProfile();
    const compatiblePlaylists = [...currentPlaylist ? [currentPlaylist] : []];
    let count = 0;
    while (true) {
      const playlists = await fetchPlaylists(teamId, channelId, auth, count, LIMIT);
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
 * /**
 * Get all playlists based on a query
 * @param {Object} event
 * @param {Object} context
 */
module.exports.handler = async (event, context) => {
  try {
    // LAMBDA FUNCTION
    const {teamId, channelId, settings, query} = event;
    const currentPlaylist = settings ? settings[PLAYLIST] : null;
    const playlists = await getCompatiblePlaylists(teamId, channelId, currentPlaylist);
    const [, searchPlaylists, other] = await Promise.all([
      storePlaylists(teamId, channelId, {value: playlists}, moment().add(1, 'hour').unix()),
      // Converts into Slack Option if it matches the search query
      (() => playlists
          .filter((playlist) => playlist.name.toLowerCase().includes(query.toLowerCase()))
          .map((playlist) => option(playlist.name, playlist.id)))(),
      // Adds our current selection if any to the list
      (() => [
        ...currentPlaylist ? [option(`${currentPlaylist.name} (Current Selection)`, `${currentPlaylist.id}`)] : [],
        option(`Create a new playlist called "${query}"`, `${NEW_PLAYLIST}${query}`),
      ])(),
    ]);

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
};
