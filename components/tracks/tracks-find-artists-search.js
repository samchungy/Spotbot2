const sns = require('/opt/sns');


const moment = require(process.env.MOMENT);
const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);
const {fetchArtists} = require('/opt/spotify/spotify-api/spotify-api-search');
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {storeArtists} = require('/opt/tracks/tracks-interface');
const {postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const Artist = require('/opt/spotify/spotify-objects/util-spotify-artist');
const {modelSearch} = require('/opt/tracks/tracks-model');

const TRACKS_FIND_ARTISTS_GET_ARTISTS = process.env.SNS_PREFIX + 'tracks-find-artists-get-artists';

const LIMIT = config.spotify_api.tracks.limit; // 24 Search results = 8 pages.

const ARTISTS_RESPONSES = {
  artist_panel: (title, url, genres, followers) => `<${url}|*${title}*>\n\n:notes: *Genres:* ${genres}\n\n:busts_in_silhouette: *Followers*: ${followers}\n`,
  error: ':warning: An error occured.',
  expired: ':information_source: Search has expired.',
  found: ':mag: Are these the artists you were looking for?',
  no_artists: (query) => `:information_source: No tracks found for the query "${query}"`,
  query_error: ':warning: Invalid query, please try again.',
  query_empty: ':information_source: No query entered. Please enter a query.',
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
    const {success, response} = await findAndStoreArtists(teamId, channelId, query, triggerId);
    if (success) {
      const params = {
        Message: JSON.stringify({teamId, channelId, userId, triggerId}),
        TopicArn: TRACKS_FIND_ARTISTS_GET_ARTISTS,
      };
      await sns.publish(params).promise();
    } else {
      await postEphemeral(
          ephemeralPost(channelId, userId, response, null),
      );
    }
  } catch (error) {
    logger.error(error);
    logger.error('Artist search failed');
  }
};

/**
 * Find tracks from Spotify and store them in our database.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} query
 * @param {triggerId} triggerId
 */
async function findAndStoreArtists(teamId, channelId, query, triggerId) {
  try {
    const auth = await authSession(teamId, channelId);
    if (query === '') {
      return {success: false, response: ARTISTS_RESPONSES.query_empty};
    }
    if (isInvalidQuery(query)) {
      return {success: false, response: ARTISTS_RESPONSES.query_error};
    }
    const profile = auth.getProfile();
    const searchResults = await fetchArtists(teamId, channelId, auth, query, profile.country, LIMIT);
    const numArtists = searchResults.artists.items.length;
    if (!numArtists) {
      return {success: false, response: ARTISTS_RESPONSES.no_artists(query)};
    }
    const expiry = moment().add('1', 'day').unix();
    const search = modelSearch(searchResults.artists.items.map((artist) => new Artist(artist)), query);
    await storeArtists(teamId, channelId, triggerId, search, expiry);
    return {success: true, response: null};
  } catch (error) {
    logger.error(error);
    return {success: false, response: ARTISTS_RESPONSES.error};
  }
};
