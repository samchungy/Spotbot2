const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);

// Spotify
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchTracksInfo} = require('/opt/spotify/spotify-api/spotify-api-tracks');
const TrackMin = require('/opt/spotify/spotify-objects/util-spotify-track-min');

// Slack
const {postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');

// Settings
const {changeBlacklistRemove, loadBlacklist, changeBlacklist} = require('/opt/db/settings-extra-interface');
const INFO_LIMIT = config.spotify_api.tracks.info_limit;
const BLACKLIST_RESPONSE = {
  failed: 'Blacklist failed to save.',
  success: `:white_check_mark: Blacklisted successfully updated.`,
};

const transformToBlacklistTrack = async (teamId, channelId, auth, country, trackIdsToAdd) => {
  const allTrackInfoPromises = [];
  const attempts = Math.ceil(trackIdsToAdd.length/INFO_LIMIT);
  for (let attempt = 0; attempt < attempts; attempt++) {
    allTrackInfoPromises.push(fetchTracksInfo(teamId, channelId, auth, country, trackIdsToAdd.slice(attempt*INFO_LIMIT, (attempt+1)*INFO_LIMIT)));
  }
  // Extract Promise Info
  const allSpotifyTrackInfos = (await Promise.all(allTrackInfoPromises)).map((infoPromise) => infoPromise.tracks).flat();
  return allSpotifyTrackInfos.map((track) => new TrackMin(track));
};

const blacklistSave = async (teamId, channelId, userId, submissions) => {
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

  const tracksToAdd = trackIdsToAdd.length ? transformToBlacklistTrack(teamId, channelId, auth, country, trackIdsToAdd) : [];

  if (trackIdsToAdd.length) {
    await changeBlacklist(teamId, channelId, tracksToAdd);
  }

  const message = ephemeralPost(channelId, userId, BLACKLIST_RESPONSE.success);
  return await postEphemeral(message);
};


module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, submissions} = JSON.parse(event.Records[0].Sns.Message);
  return await blacklistSave(teamId, channelId, userId, submissions)
      .catch((error)=>{
        logger.error(error, BLACKLIST_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, userId, BLACKLIST_RESPONSE.failed);
      });
};
