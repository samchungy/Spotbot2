const logger = require(process.env.LOGGER);
const moment = require(process.env.MOMENT);

// Search
const {storeSearch} = require('/opt/db/search-interface');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchArtistTracks} = require('/opt/spotify/spotify-api/spotify-api-tracks');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

// Tracks
const {showResults} = require('./layers/get-tracks');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const ARTISTS_RESPONSES = {
  failed: 'Finding artist tracks failed',
};

const getArtistTracks = async (teamId, channelId, userId, artistId, triggerId, responseUrl) => {
  const auth = await authSession(teamId, channelId);
  const profile = auth.getProfile();
  const spotifyTracks = await fetchArtistTracks(teamId, channelId, auth, profile.country, artistId);
  const tracks = spotifyTracks.tracks.map((track) => new Track(track));
  const expiry = moment().add('1', 'day').unix();
  await storeSearch(teamId, channelId, triggerId, tracks, artistId, expiry);
  return showResults(teamId, channelId, userId, triggerId, responseUrl);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, artistId, triggerId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  await getArtistTracks(teamId, channelId, userId, artistId, triggerId, responseUrl)
      .catch((error)=>{
        logger.error(error, ARTISTS_RESPONSES.failed);
        reportErrorToSlack(teamId, channelId, userId, ARTISTS_RESPONSES.failed);
      });
};
