const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchTracksInfo} = require('/opt/spotify/spotify-api-v2/spotify-api-tracks');
const TrackMin = require('/opt/spotify/spotify-objects/util-spotify-track-min');

// Slack
const {postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Settings
const {changeBlacklistRemove, loadBlacklist, changeBlacklist} = require('/opt/db/settings-extra-interface');
const INFO_LIMIT = config.spotify_api.tracks.info_limit;
const RESPONSE = {
  failed: 'Blacklist failed to save',
  success: `:white_check_mark: Blacklisted successfully updated.`,
};

const transformToBlacklistTrack = async (auth, country, trackIdsToAdd) => {
  console.log(trackIdsToAdd);
  const allTrackInfoPromises = [];
  const attempts = Math.ceil(trackIdsToAdd.length/INFO_LIMIT);
  for (let attempt = 0; attempt < attempts; attempt++) {
    allTrackInfoPromises.push(fetchTracksInfo(auth, country, trackIdsToAdd.slice(attempt*INFO_LIMIT, (attempt+1)*INFO_LIMIT)));
  }
  // Extract Promise Info
  const allSpotifyTrackInfos = (await Promise.all(allTrackInfoPromises)).map((infoPromise) => infoPromise.tracks).flat();
  return allSpotifyTrackInfos.map((track) => new TrackMin(track));
};

const main = async (teamId, channelId, userId, submissions) => {
  const [auth, blacklist] = await Promise.all([authSession(teamId, channelId), loadBlacklist(teamId, channelId)]);
  const blacklistTracks = blacklist ? blacklist.blacklist : [];
  const {country} = auth.getProfile();

  const [currentList, trackIdsToAdd] = submissions.reduce(([curr, adds], submission) => {
    const track = blacklistTracks.find((track) => track.id === submission.value);
    return track ? [[...curr, track], adds] : [curr, [...adds, submission.value]];
  }, [[], []]);

  const tracksToRemove = blacklistTracks.reduce((remove, track, index) => { // Highly efficient way to filter the tracks after finding the unique Uris
    return currentList[index - remove.length] !== track.id ? [...remove, index] : remove;
  }, []);

  if (tracksToRemove.length) {
    await changeBlacklistRemove(teamId, channelId, tracksToRemove);
  }

  const tracksToAdd = trackIdsToAdd.length ? await transformToBlacklistTrack(auth, country, trackIdsToAdd) : [];

  if (trackIdsToAdd.length) {
    await changeBlacklist(teamId, channelId, tracksToAdd);
  }

  const message = ephemeralPost(channelId, userId, RESPONSE.success);
  return await postEphemeral(message);
};


module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, submissions} = JSON.parse(event.Records[0].Sns.Message);
  return await main(teamId, channelId, userId, submissions)
      .catch((error)=>{
        logger.error(error, RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, RESPONSE.failed);
      });
};
