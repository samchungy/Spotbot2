const logger = require('/opt/utils/util-logger');
const moment = require('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030');

// Search
const {modelSearch, storeSearch} = require('/opt/db/search-interface');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchArtistTracks} = require('/opt/spotify/spotify-api-v2/spotify-api-tracks');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');

// Tracks
const {showResults} = require('./layers/get-tracks');

// Slack
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const RESPONSE = {
  failed: 'Finding artist tracks failed',
};

const main = async (teamId, channelId, userId, artistId, triggerId, responseUrl) => {
  const auth = await authSession(teamId, channelId);
  const profile = auth.getProfile();
  const spotifyTracks = await fetchArtistTracks(auth, profile.country, artistId);
  const tracks = spotifyTracks.tracks.map((track) => new Track(track));
  const expiry = moment().add('1', 'day').unix();
  const storeTracks = tracks.slice(3);
  if (storeTracks.length) {
    await storeSearch(teamId, channelId, triggerId, modelSearch(storeTracks, artistId, 1), expiry);
  }
  const showTracks = modelSearch(tracks, artistId, 0);
  return showResults(teamId, channelId, userId, triggerId, responseUrl, showTracks);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, artistId, triggerId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  await main(teamId, channelId, userId, artistId, triggerId, responseUrl)
      .catch(async (error)=>{
        logger.error(error, RESPONSE.failed);
        await reportErrorToSlack(channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
