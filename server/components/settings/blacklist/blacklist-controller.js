const config = require('config');
const logger = require('../../../util/util-logger');
const {loadBlacklist, storeBlacklist} = require('./blacklist-dal');
const {loadProfile} = require('../settings-interface');
const {loadSkip} = require('../../control/control-dal');
const {fetchCurrentPlayback, fetchRecent} = require('../../spotify-api/spotify-api-playback-status');
const {fetchTracksInfo} = require('../../spotify-api/spotify-api-tracks');
const {sendModal, postEphemeral} = require('../../slack/slack-api');
const {ephemeralPost} = require('../../slack/format/slack-format-reply');
const {multiSelectStaticGroups, option, optionGroup, slackModal} = require('../../slack/format/slack-format-modal');
const Track = require('../../../util/util-spotify-track');
const INFO_LIMIT = config.get('spotify_api.tracks.info_limit');
const LIMIT = config.get('spotify_api.recent_limit');
const BLACKLIST_LIMIT = config.get('dynamodb.blacklist.limit');
const BLACKLIST_MODAL = config.get('slack.actions.blacklist_modal');
const BLACKLIST_RESPONSE = {
  label: 'Blacklisted Tracks',
  hint: `Songs which are blacklisted cannot be added through Spotbot. They can also be skipped instantly. Max tracks: ${BLACKLIST_LIMIT}`,
  currently_blacklisted: 'Currently on the blacklist:',
  recently_played: 'Recently played:',
  currently: 'Currently playing:',
  skipped: 'Skipped Recently:',
  too_many_tracks: 'You have tried to add too many tracks to the blacklist. Please remove some.',
};

/**
 * Open the blacklist modal
 * @param {string} teamId
 * @param {string} channelId
 * @param {string} triggerId
 */
async function openBlacklistModal(teamId, channelId, triggerId) {
  try {
    const blacklistTracks = await loadBlacklist(teamId, channelId);
    const blacklistOptions = blacklistTracks.map((track) => option(track.title, track.id));
    const spotifyRecent = await fetchRecent(teamId, channelId, LIMIT);
    const status = await fetchCurrentPlayback(teamId, channelId);
    const currentOptions = [];
    const skipOptions = [];
    const skip = await loadSkip(teamId, channelId);
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
    await sendModal(triggerId, modal);
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Save blacklist tracks
 * @param {Object} view
 * @param {String} userId
 */
async function saveBlacklist(view, userId) {
  try {
    const teamId = view.team_id;
    const channelId = view.private_metadata;
    const submissions = extractSubmissions(view);
    let currentList;
    let trackUrisToAdd;
    const [{country}, blacklistTracks]= await Promise.all([loadProfile(teamId, channelId), loadBlacklist(teamId, channelId)]);
    if (submissions) {
      if (submissions.length > BLACKLIST_MODAL) {
        return {
          response_action: 'errors',
          errors: {[BLACKLIST_MODAL]: BLACKLIST_RESPONSE.too_many_tracks},
        };
      }
      // See which tracks are still on the blacklist and which need to be added
      {
        [currentList, trackUrisToAdd] = submissions.reduce(([curr, adds], submission) => {
          const track = blacklistTracks.find((track) => track.id === submission.value);
          return track ? [[...curr, track], adds] : [curr, [...adds, submission.value]];
        }, [[], []]);
      }

      if (trackUrisToAdd.length) {
        const allTrackInfoPromises = [];
        const attempts = Math.ceil(trackUrisToAdd.length/INFO_LIMIT);
        for (let attempt = 0; attempt < attempts; attempt++) {
          allTrackInfoPromises.push(fetchTracksInfo(teamId, channelId, country, trackUrisToAdd.slice(attempt*INFO_LIMIT, (attempt+1)*INFO_LIMIT)));
        }
        // Extract Promise Info
        const allSpotifyTrackInfos = (await Promise.all(allTrackInfoPromises)).map((infoPromise) => infoPromise.tracks).flat();
        currentList = [...currentList, ...allSpotifyTrackInfos.map((track) => new Track(track))];
      }
    } else {
      currentList = [];
    }

    await storeBlacklist(teamId, channelId, currentList);
    await postEphemeral(
        ephemeralPost(channelId, userId, `:white_check_mark: Blacklisted successfully updated.`, null),
    );
  } catch (error) {
    logger.error(error);
  }
}

/**
 * Extract the results from the submitted Slack modal view
 * @param {object} view
 * @return {Array} Submission values
 */
function extractSubmissions(view) {
  const values = view.state.values;
  let submissions = [];
  for (const setting in values) {
    if ({}.hasOwnProperty.call(values, setting)) {
      switch (setting) {
        case BLACKLIST_MODAL:
          submissions = values[setting][setting].selected_options;
          break;
      }
    }
  }
  return submissions;
}

module.exports ={
  openBlacklistModal,
  saveBlacklist,
};
