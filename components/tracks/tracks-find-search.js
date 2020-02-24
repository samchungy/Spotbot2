const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();

const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchSearchTracks} = require('/opt/spotify/spotify-api/spotify-api-search');
const {storeTracks} = require('/opt/tracks/tracks-interface');
const {postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const {modelSearch} = require('/opt/tracks/tracks-model');
const EXPIRY = Math.floor(Date.now() / 1000) + 86400; // Current Time in Epoch + 84600 (A day)
const LIMIT = config.spotify_api.tracks.limit; // 24 Search results = 8 pages.

const TRACK_RESPONSE = {
  error: ':warning: Track search failed. Please try again.',
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
    const auth = await authSession(teamId, channelId);
    if (query === '') {
      return {success: false, response: TRACK_RESPONSE.query_empty};
    }
    if (isInvalidQuery(query)) {
      return {success: false, response: TRACK_RESPONSE.query_error};
    }
    const profile = auth.getProfile();
    const searchResults = await fetchSearchTracks(teamId, channelId, auth, query, profile.country, LIMIT);
    const numTracks = searchResults.tracks.items.length;
    if (!numTracks) {
      return {success: false, response: TRACK_RESPONSE.no_tracks + `"${query}".`};
    }
    const search = modelSearch(searchResults.tracks.items.map((track) => new Track(track)), query);
    await storeTracks(teamId, channelId, triggerId, search, EXPIRY);
    return {success: true, response: null};
  } catch (error) {
    logger.error(error);
    return {success: false, response: TRACK_RESPONSE.error};
  }
};

/**
 * Checks if the query is valid
 * @param {string} query
 * @return {Boolean}
 */
function isInvalidQuery(query) {
  // Query's are not allowed to contain more than 1 wildcard, as we append a wildcard at the end
  return ((query.match(/\*/g)||[]).length > 1 || query.match(/".*."/gs));
}


module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, query, triggerId} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const {success, response} = await findAndStore(teamId, channelId, query, triggerId);
    if (success) {
      const params = {
        Message: JSON.stringify({teamId, channelId, userId, triggerId}),
        TopicArn: process.env.TRACKS_FIND_GET_TRACKS,
      };
      await sns.publish(params).promise();
    } else {
      await postEphemeral(
          ephemeralPost(channelId, userId, response, null),
      );
    }
  } catch (error) {
    logger.error(error);
    logger.error('Track search failed');
  }
};
