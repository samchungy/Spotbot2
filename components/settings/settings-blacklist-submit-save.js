const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const {authSession} = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {loadBlacklist, storeBlacklist} = require('/opt/settings/settings-extra-interface');
const {fetchTracksInfo} = require('/opt/spotify/spotify-api/spotify-api-tracks');
const {postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const INFO_LIMIT = config.spotify_api.tracks.info_limit;
const BLACKLIST_RESPONSE = {
  error: ':warning: Blacklist failed to save.',
  success: `:white_check_mark: Blacklisted successfully updated.`,
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, submissions} = JSON.parse(event.Records[0].Sns.Message);

  try {
    let blacklistTracks = [];
    const [auth, blacklist] = await Promise.all([authSession(teamId, channelId), loadBlacklist(teamId, channelId)]);
    if (blacklist) {
      blacklistTracks = blacklist.blacklist;
    }
    const {country} = auth.getProfile();
    let currentList;
    let trackIdsToAdd;
    if (submissions) {
      // See which tracks are still on the blacklist and which need to be added
      {
        [currentList, trackIdsToAdd] = submissions.reduce(([curr, adds], submission) => {
          const track = blacklistTracks.find((track) => track.id === submission.value);
          return track ? [[...curr, track], adds] : [curr, [...adds, submission.value]];
        }, [[], []]);
      }

      if (trackIdsToAdd.length) {
        const allTrackInfoPromises = [];
        const attempts = Math.ceil(trackIdsToAdd.length/INFO_LIMIT);
        for (let attempt = 0; attempt < attempts; attempt++) {
          allTrackInfoPromises.push(fetchTracksInfo(teamId, channelId, auth, country, trackIdsToAdd.slice(attempt*INFO_LIMIT, (attempt+1)*INFO_LIMIT)));
        }
        // Extract Promise Info
        const allSpotifyTrackInfos = (await Promise.all(allTrackInfoPromises)).map((infoPromise) => infoPromise.tracks).flat();
        currentList = [...currentList, ...allSpotifyTrackInfos.map((track) => new Track(track))];
        await storeBlacklist(teamId, channelId, {blacklist: currentList});
      }
    } else {
      currentList = [];
      await storeBlacklist(teamId, channelId, {blacklist: currentList});
    }

    await postEphemeral(
        ephemeralPost(channelId, userId, BLACKLIST_RESPONSE.success, null),
    );
  } catch (error) {
    logger.error(error);
  }
};
