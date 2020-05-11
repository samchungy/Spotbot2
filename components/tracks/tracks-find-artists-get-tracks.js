const sns = require('/opt/sns');


const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchArtistTracks} = require('/opt/spotify/spotify-api/spotify-api-tracks');
const {modelSearch} = require('/opt/tracks/tracks-model');
const {storeTracks} = require('/opt/tracks/tracks-interface');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const {reply} = require('/opt/slack/slack-api');
const {updateReply} = require('/opt/slack/format/slack-format-reply');

const TRACKS_FIND_GET_TRACKS = process.env.SNS_PREFIX + 'tracks-find-get-tracks';

const ARTISTS_RESPONSES = {
  error: ':warning: An error occured.',
};

/**
 * Find tracks from Spotify and store them in our database.
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} artistId
 * @param {string} triggerId
 */
async function getArtistTracks(teamId, channelId, artistId, triggerId) {
  try {
    const auth = await authSession(teamId, channelId);
    const expiry = moment().add('1', 'day').unix();
    const profile = auth.getProfile();
    const spotifyTracks = await fetchArtistTracks(teamId, channelId, auth, profile.country, artistId);
    const search = modelSearch(spotifyTracks.tracks.map((track) => new Track(track)), artistId);
    await storeTracks(teamId, channelId, triggerId, search, expiry);
    return {success: true, response: null};
  } catch (error) {
    logger.error(error);
    logger.error('Fetching artist tracks failed');
    return {success: false, response: ARTISTS_RESPONSES.error};
  }
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, artistId, userId, triggerId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const {success, response} = await getArtistTracks(teamId, channelId, artistId, triggerId);
    if (success) {
      const params = {
        Message: JSON.stringify({teamId, channelId, userId, triggerId, responseUrl}),
        TopicArn: TRACKS_FIND_GET_TRACKS,
      };
      await sns.publish(params).promise();
    } else {
      await reply(
          updateReply(response, null),
          responseUrl,
      );
    }
  } catch (error) {
    logger.error(error);
  }
};
