const config = require(process.env.CONFIG);

// Search
const {loadSearch, removeThreeSearches} = require('/opt/db/search-interface');

// Slack
const {actionSection, buttonActionElement, contextSection, imageSection, textSection} = require('/opt/slack/format/slack-format-blocks');
const {postEphemeral, reply} = require('/opt/slack/slack-api');
const {ephemeralPost, updateReply} = require('/opt/slack/format/slack-format-reply');

// Constants
const TRACK_ACTIONS = config.slack.actions.tracks;
const ARTIST_ACTIONS = config.slack.actions.artists;
const DISPLAY_LIMIT = config.slack.limits.max_options;
const BUTTON = config.slack.buttons;

const ARTISTS_RESPONSES = {
  error: ':warning: An error occured.',
  expired: ':information_source: Search has expired.',
  found: ':mag: Are these the artists you were looking for?',
};

const artistPanel = (title, url, genres, followers) => `<${url}|*${title}*>\n\n:notes: *Genres:* ${genres}\n\n:busts_in_silhouette: *Followers*: ${followers}\n`;

const getArtistBlock = (artist) => {
  return [
    imageSection(artistPanel(artist.name, artist.url, artist.genres, artist.followers), artist.art, `Artist Art`),
    actionSection(null, [buttonActionElement(ARTIST_ACTIONS.view_artist_tracks, `View Artist Tracks`, artist.id, false, BUTTON.primary)]),
  ];
};

const showResults = async (teamId, channelId, userId, triggerId, responseUrl) => {
  const artistSearch = await loadSearch(teamId, channelId, triggerId, responseUrl);
  if (!artistSearch) {
    const message = updateReply(ARTISTS_RESPONSES.expired, null);
    return await reply(message, responseUrl);
  }

  artistSearch.currentSearch += 1;
  const displayArtists = artistSearch.searchItems.splice(0, DISPLAY_LIMIT);
  const blocks = [
    textSection(ARTISTS_RESPONSES.found),
    ...displayArtists.map(getArtistBlock).flat(),
    contextSection(null, `Page ${artistSearch.currentSearch}/${artistSearch.numSearches}`),
    actionSection(null, [
      ...artistSearch.currentSearch != artistSearch.numSearches ? [buttonActionElement(ARTIST_ACTIONS.see_more_artists, `Next 3 Artists`, triggerId, false)] : [],
      buttonActionElement(TRACK_ACTIONS.cancel_search, `Cancel Search`, triggerId, false, BUTTON.danger),
    ],
    ),
  ];
  await removeThreeSearches(teamId, channelId, triggerId);

  // If this is an update
  if (responseUrl) {
    const message = updateReply(ARTISTS_RESPONSES.found, blocks);
    return await reply(message, responseUrl);
  }

  const message = ephemeralPost(channelId, userId, ARTISTS_RESPONSES.found, blocks);
  return await postEphemeral(message);
};

module.exports = {
  showResults,
};
