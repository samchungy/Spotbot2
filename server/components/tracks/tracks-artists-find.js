const logger = require('../../util/util-logger');
const config = require('config');
const {fetchArtists} = require('../spotify-api/spotify-api-search');
const {fetchArtistTracks} = require('../spotify-api/spotify-api-tracks');
const {loadTrackSearch, storeTrackSearch} = require('./tracks-dal');
const {loadProfile} = require('../settings/settings-interface');
const {actionSection, buttonActionElement, contextSection, imageSection, textSection} = require('../slack/format/slack-format-blocks');
const {postEphemeral, reply} = require('../slack/slack-api');
const {ephemeralPost, updateReply} = require('../slack/format/slack-format-reply');
const {isInvalidQuery} = require('./tracks-find');
const Artist = require('../../util/util-spotify-artist');
const Track = require('../../util/util-spotify-track');
const Search = require('../../util/util-spotify-search');
const EXPIRY = Math.floor(Date.now() / 1000) + 86400; // Current Time in Epoch + 84600 (A day)
const TRACKS = config.get('slack.responses.tracks');
const LIMIT = config.get('spotify_api.tracks.limit'); // 24 Search results = 8 pages.
const ARTISTS = config.get('slack.responses.artists');
const ARTIST_ACTIONS = config.get('slack.actions.artists');
const TRACK_ACTIONS = config.get('slack.actions.tracks');

const DISPLAY_LIMIT = config.get('slack.limits.max_options');
const BUTTON = config.get('slack.buttons');

const artistPanel = (title, url, genres, followers) => `<${url}|*${title}*>\n\n:notes: *Genres:* ${genres}\n\n:busts_in_silhouette: *Followers*: ${followers}\n`;

/**
 * Find tracks from Spotify and store them in our database.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} query
 * @param {triggerId} triggerId
 */
async function findAndStoreArtists(teamId, channelId, query, triggerId) {
  try {
    if (query === '') {
      return {success: false, response: TRACKS.query.empty};
    }
    if (isInvalidQuery(query)) {
      return {success: false, response: TRACKS.query.error};
    }
    const profile = await loadProfile(teamId, channelId);
    const searchResults = await fetchArtists(teamId, channelId, query, profile.country, LIMIT);
    const numArtists = searchResults.artists.items.length;
    if (!numArtists) {
      return {success: false, response: TRACKS.no_tracks + `"${query}".`};
    }
    const search = new Search(searchResults.artists.items.map((artist) => new Artist(artist)), query);
    await storeTrackSearch(teamId, channelId, triggerId, search, EXPIRY);
    return {success: true, response: null};
  } catch (error) {
    logger.error(error);
    return {success: false, response: TRACKS.error};
  }
};

/**
 * Get Three Artists from db
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} userId
 * @param {string} triggerId
 * @param {string} responseUrl
 */
async function getThreeArtists(teamId, channelId, userId, triggerId, responseUrl) {
  try {
    const artistSearch = await loadTrackSearch(teamId, channelId, triggerId);
    if (!artistSearch) {
      await reply(
          updateReply(TRACKS.expired, null),
          responseUrl,
      );
    }
    artistSearch.currentSearch += 1;
    const currentArtists = artistSearch.items.splice(0, DISPLAY_LIMIT);
    const artistBlocks = currentArtists.map((artist) => {
      return [
        imageSection(
            artistPanel(artist.name, artist.url, artist.genres, artist.followers),
            artist.art,
            `Artist Art`,
        ),
        actionSection(
            null,
            [buttonActionElement(ARTIST_ACTIONS.view_artist_tracks, `View Artist Tracks`, artist.id, false, BUTTON.primary)],
        ),
      ];
    }).flat();

    const blocks = [
      textSection(ARTISTS.found),
      ...artistBlocks,
      contextSection(null, `Page ${artistSearch.currentSearch}/${artistSearch.numSearches}`),
      actionSection(
          null,
          [
            ...artistSearch.items.length ? [buttonActionElement(ARTIST_ACTIONS.see_more_artists, `Next 3 Artists`, triggerId, false)] : [],
            buttonActionElement(TRACK_ACTIONS.cancel_search, `Cancel Search`, triggerId, false, BUTTON.danger),
          ],
      ),
    ];
    await storeTrackSearch(teamId, channelId, triggerId, artistSearch, EXPIRY);

    // This is an update request
    if (responseUrl) {
      await reply(
          updateReply(TRACKS.found, blocks),
          responseUrl,
      );
    } else {
      await postEphemeral(
          ephemeralPost(channelId, userId, TRACKS.found, blocks),
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Find tracks from Spotify and store them in our database.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} artistId
 * @param {string} triggerId
 */
async function getArtistTracks(teamId, channelId, artistId, triggerId) {
  try {
    const profile = await loadProfile(teamId, channelId);
    const spotifyTracks = await fetchArtistTracks(teamId, channelId, profile.country, artistId);
    const search = new Search(spotifyTracks.tracks.map((track) => new Track(track)), artistId);
    await storeTrackSearch(teamId, channelId, triggerId, search, EXPIRY);
    return {success: true, response: null};
  } catch (error) {
    logger.error(error);
    return {success: false, response: TRACKS.error};
  }
};


module.exports = {
  findAndStoreArtists,
  getArtistTracks,
  getThreeArtists,
};
