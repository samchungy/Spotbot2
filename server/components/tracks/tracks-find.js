const logger = require('../../util/util-logger');
const config = require('config');
const {fetchSearchTracks} = require('../spotify-api/spotify-api-search');
const {loadTrackSearch, storeTrackSearch} = require('./tracks-dal');
const {loadProfile} = require('../settings/settings-interface');
const {actionSection, buttonActionElement, contextSection, imageSection, textSection} = require('../slack/format/slack-format-blocks');
const {postEphemeral, reply} = require('../slack/slack-api');
const {ephemeralPost, updateReply} = require('../slack/format/slack-format-reply');
const Track = require('../../util/util-spotify-track');
const Search = require('../../util/util-spotify-search');
const EXPIRY = Math.floor(Date.now() / 1000) + 86400; // Current Time in Epoch + 84600 (A day)
const LIMIT = config.get('spotify_api.tracks.limit'); // 24 Search results = 8 pages.
const TRACK_ACTIONS = config.get('slack.actions.tracks');
const DISPLAY_LIMIT = config.get('slack.limits.max_options');
const BUTTON = config.get('slack.buttons');
const trackPanel = (title, url, artist, album, time) => `<${url}|*${title}*>\n:clock1: *Duration*: ${time}\n:studio_microphone: *Artists:* ${artist}\n:dvd: *Album*: ${album}\n`;

const TRACKS_RESPONSES = {
  error: ':warning: An error occured.',
  expired: ':information_source: Search has expired.',
  found: ':mag: Are these the tracks you were looking for?',
  no_tracks: ':information_source: No tracks found for the query ',
  query_empty: ':information_source: No query entered. Please enter a query.',
  query_error: ':warning: Invalid query, please try again.',
};

/**
 * Find tracks from Spotify and store them in our database.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} query
 * @param {triggerId} triggerId
 */
async function findAndStore(teamId, channelId, query, triggerId) {
  try {
    if (query === '') {
      return {success: false, response: TRACKS_RESPONSES.query_empty};
    }
    if (isInvalidQuery(query)) {
      return {success: false, response: TRACKS_RESPONSES.query_error};
    }
    const profile = await loadProfile(teamId, channelId);
    const searchResults = await fetchSearchTracks(teamId, channelId, query, profile.country, LIMIT);
    const numTracks = searchResults.tracks.items.length;
    if (!numTracks) {
      return {success: false, response: TRACKS_RESPONSES.no_tracks + `"${query}".`};
    }
    const search = new Search(searchResults.tracks.items.map((track) => new Track(track)), query);
    await storeTrackSearch(teamId, channelId, triggerId, search, EXPIRY);
    return {success: true, response: null};
  } catch (error) {
    logger.error(error);
    return {success: false, response: TRACKS_RESPONSES.error};
  }
};

/**
 * Get Three Tracks from db
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} triggerId
 * @param {string} responseUrl
 */
async function getThreeTracks(teamId, channelId, userId, triggerId, responseUrl) {
  try {
    const trackSearch = await loadTrackSearch(teamId, channelId, triggerId);
    if (!trackSearch) {
      await reply(
          updateReply(TRACKS_RESPONSES.expired, null),
          responseUrl,
      );
    }
    trackSearch.currentSearch += 1;
    const currentTracks = trackSearch.items.splice(0, DISPLAY_LIMIT);
    const trackBlocks = currentTracks.map((track) => {
      return [
        imageSection(
            trackPanel(track.name, track.url, track.artists, track.album, track.duration),
            track.art,
            `Album Art`,
        ),
        actionSection(
            null,
            [buttonActionElement(TRACK_ACTIONS.add_to_playlist, `+ Add to playlist`, track.uri, false, BUTTON.primary)],
        ),
      ];
    }).flat();

    const blocks = [
      textSection(TRACKS_RESPONSES.found),
      ...trackBlocks,
      contextSection(null, `Page ${trackSearch.currentSearch}/${trackSearch.numSearches}`),
      actionSection(
          null,
          [
            ...trackSearch.items.length ? [buttonActionElement(TRACK_ACTIONS.see_more_results, `Next 3 Tracks`, triggerId, false)] : [],
            buttonActionElement(TRACK_ACTIONS.cancel_search, `Cancel Search`, triggerId, false, BUTTON.danger),
          ],
      ),
    ];
    await storeTrackSearch(teamId, channelId, triggerId, trackSearch, EXPIRY);

    // This is an update request
    if (responseUrl) {
      await reply(
          updateReply(TRACKS_RESPONSES.found, blocks),
          responseUrl,
      );
    } else {
      await postEphemeral(
          ephemeralPost(channelId, userId, TRACKS_RESPONSES.found, blocks),
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Checks if the query is valid
 * @param {string} query
 * @return {Boolean}
 */
function isInvalidQuery(query) {
  // Query's are not allowed to contain more than 1 wildcard, as we append a wildcard at the end
  return ((query.match(/\*/g)||[]).length > 1 || query.match(/".*."/gs));
}

module.exports = {
  getThreeTracks,
  findAndStore,
  isInvalidQuery,
};
