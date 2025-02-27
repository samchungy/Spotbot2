const config = require('/opt/config/config');

// Search
const {loadSearch, removeThreeSearches} = require('/opt/db/search-interface');

// Slack
const {actionSection, buttonActionElement, contextSection, imageSection, textSection} = require('/opt/slack/format/slack-format-blocks');
const {postEphemeral, reply} = require('/opt/slack/slack-api');
const {ephemeralPost, updateReply} = require('/opt/slack/format/slack-format-reply');

// Constants
const TRACK_ACTIONS = config.slack.actions.tracks;
const DISPLAY_LIMIT = config.slack.limits.max_options;
const BUTTON = config.slack.buttons;

const RESPONSE = {
  error: ':warning: An error occured.',
  expired: ':information_source: Search has expired.',
  found: ':mag: Are these the tracks you were looking for?',
};

const trackPanel = (title, url, artist, album, time) => `<${url}|*${title}*>\n:clock1: *Duration*: ${time}\n:studio_microphone: *Artists:* ${artist}\n:dvd: *Album*: ${album}\n`;
const trackValue = (title, uri, id) => JSON.stringify({title, uri, id});
const getTrackBlock = (track) => {
  return [
    imageSection(trackPanel(track.name, track.url, track.artists, track.album, track.duration), track.art, `Album Art`),
    actionSection(null, [buttonActionElement(TRACK_ACTIONS.add_to_playlist, `+ Add to playlist`, trackValue(track.title, track.uri, track.id), false, BUTTON.primary)]),
  ];
};

const showResults = async (teamId, channelId, userId, triggerId, responseUrl, tracks) => {
  const trackSearch = tracks ? tracks : await loadSearch(teamId, channelId, triggerId);

  if (!trackSearch || !trackSearch.searchItems.length) {
    const message = updateReply(RESPONSE.expired, null);
    return await reply(message, responseUrl);
  }

  trackSearch.currentSearch += 1;
  const displayTracks = trackSearch.searchItems.splice(0, DISPLAY_LIMIT);
  const blocks = [
    textSection(RESPONSE.found),
    ...displayTracks.map(getTrackBlock).flat(),
    contextSection(null, `Page ${trackSearch.currentSearch}/${trackSearch.numSearches}`),
    actionSection(null, [
      ...trackSearch.currentSearch != trackSearch.numSearches ? [buttonActionElement(TRACK_ACTIONS.see_more_results, `Next 3 Tracks`, triggerId, false)] : [],
      buttonActionElement(TRACK_ACTIONS.cancel_search, `Cancel Search`, triggerId, false, BUTTON.danger),
    ]),
  ];
  if (!tracks) {
    await removeThreeSearches(teamId, channelId, triggerId);
  }
  // If this is an update
  if (responseUrl) {
    const message = updateReply(RESPONSE.found, blocks);
    return await reply(message, responseUrl);
  }

  const message = ephemeralPost(channelId, userId, RESPONSE.found, blocks);
  return await postEphemeral(message);
};

module.exports = {
  showResults,
  trackPanel,
  trackValue,
  RESPONSE,
};
