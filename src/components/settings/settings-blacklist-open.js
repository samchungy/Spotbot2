const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const authSession = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {loadBlacklist, loadSkip} = require('/opt/db/settings-extra-interface');
const {fetchCurrentPlayback, fetchRecent} = require('/opt/spotify/spotify-api-v2/spotify-api-playback-status');
const {updateModal} = require('/opt/slack/slack-api');
const {multiSelectStaticGroups, option, optionGroup, slackModal} = require('/opt/slack/format/slack-format-modal');
const Track = require('/opt/spotify/spotify-objects/util-spotify-track');
const LIMIT = config.spotify_api.recent_limit;
const BLACKLIST_LIMIT = config.dynamodb.blacklist.limit;
const BLACKLIST_MODAL = config.slack.actions.blacklist_modal;
const BLACKLIST_RESPONSE = {
  label: 'Blacklisted Tracks',
  hint: `Songs which are blacklisted cannot be added through Spotbot. They can also be skipped instantly. Max tracks: ${BLACKLIST_LIMIT}`,
  currently_blacklisted: 'Currently on the blacklist:',
  recently_played: 'Recently played:',
  currently: 'Currently playing:',
  skipped: 'Skipped Recently:',
  too_many_tracks: 'You have tried to add too many tracks to the blacklist. Please remove some.',
};


module.exports.handler = async (event, context) => {
  const {teamId, channelId, viewId} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const currentOptions = [];
    const skipOptions = [];

    const auth = await authSession(teamId, channelId);
    const [spotifyRecent, status, skip, blacklist] = await Promise.all([
      fetchRecent(auth, LIMIT),
      fetchCurrentPlayback(auth),
      loadSkip(teamId, channelId),
      loadBlacklist(teamId, channelId),
    ]);
    const blacklistTracks = blacklist ? blacklist.blacklist : [];
    const blacklistOptions = blacklistTracks.map((track) => option(track.title, track.id));

    if (skip && skip.history) {
      skip.history.forEach((track) => {
        skipOptions.push(option(track.title, track.id));
      });
    }
    if (status && status.item) {
      const currentTrack = new Track(status.item);
      currentOptions.push(option(currentTrack.title, currentTrack.id));
    }
    const recentOptions = spotifyRecent.items.map((item) => {
      const track = new Track(item.track);
      return option(track.title, track.id);
    });
    const allOptions = [
      ...skipOptions.length ? [optionGroup(BLACKLIST_RESPONSE.skipped, skipOptions)] : [],
      ...currentOptions.length ? [optionGroup(BLACKLIST_RESPONSE.currently, currentOptions)] : [],
      ...recentOptions.length ? [optionGroup(BLACKLIST_RESPONSE.recently_played, recentOptions)] : [],
      ...blacklistOptions.length ? [optionGroup(BLACKLIST_RESPONSE.currently_blacklisted, blacklistOptions)] : [],
    ];
    const blocks = [
      multiSelectStaticGroups(BLACKLIST_MODAL, BLACKLIST_RESPONSE.label, BLACKLIST_RESPONSE.hint, blacklistOptions.length ? blacklistOptions : null, allOptions, true),
    ];
    const modal = slackModal(BLACKLIST_MODAL, `Spotbot Blacklist`, `Save`, `Close`, blocks, false, channelId);
    await updateModal(viewId, modal);
  } catch (error) {
    logger.error(error);
  }
};
