const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');
const logger = require('/opt/utils/util-logger');
const config = require('/opt/config/config');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchSearchTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-search');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

// Slack
const {postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Search
const {modelSearch, storeSearch} = require('/opt/db/search-interface');

// Tracks
const {showResults} = require('./layers/get-tracks');

// Constants
const LIMIT = config.spotify_api.tracks.limit; // 24 Search results = 8 pages.
const RESPONSE = {
  failed: 'Finding tracks failed',
  error: ':warning: Track search failed. Please try again.',
  no_tracks: ':information_source: No tracks found for the query ',
  query_empty: ':information_source: No query entered. Please enter a query.',
  query_error: ':warning: Invalid query, please try again.',
};

/**
 * Checks if the query is valid
 * @param {string} query
 * @return {Boolean}
 */
const isInvalidQuery = (query) => {
  // Query's are not allowed to contain more than 1 wildcard, as we append a wildcard at the end
  return (query.match(new RegExp('\\*', 'g'))||[]).length > 1;
};

const main = async (teamId, channelId, userId, query, triggerId) => {
  const auth = await authSession(teamId, channelId);
  if (query === '') {
    const message = ephemeralPost(channelId, userId, RESPONSE.query_empty, null);
    return await postEphemeral(message);
  }
  if (isInvalidQuery(query)) {
    const message = ephemeralPost(channelId, userId, RESPONSE.query_error, null);
    return await postEphemeral(message);
  }

  const profile = auth.getProfile();
  const searchResults = await fetchSearchTracks(auth, query, profile.country, LIMIT);
  const numTracks = searchResults.tracks.items.length;
  if (!numTracks) {
    const message = ephemeralPost(channelId, userId, RESPONSE.no_tracks + `"${query}".`, null);
    return await postEphemeral(message);
  }
  const expiry = moment().add('1', 'day').unix();
  const tracks = searchResults.tracks.items.map((track) => new Track(track));
  const storeTracks = tracks.slice(3);
  if (storeTracks.length) {
    await storeSearch(teamId, channelId, triggerId, modelSearch(storeTracks, query, 1), expiry);
  }
  const showTracks = modelSearch(tracks, query, 0);
  return showResults(teamId, channelId, userId, triggerId, null, showTracks);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, query, triggerId} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, userId, query, triggerId)
      .catch(async (error)=>{
        logger.error(error, RESPONSE.failed);
        await reportErrorToSlack(channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
