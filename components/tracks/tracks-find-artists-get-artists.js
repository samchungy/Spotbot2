const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);
const {loadSearch, removeThreeSearches} = require('/opt/search/search-interface');
const {actionSection, buttonActionElement, contextSection, imageSection, textSection} = require('/opt/slack/format/slack-format-blocks');
const {postEphemeral, reply} = require('/opt/slack/slack-api');
const {ephemeralPost, updateReply} = require('/opt/slack/format/slack-format-reply');
const TRACK_ACTIONS = config.slack.actions.tracks;
const ARTIST_ACTIONS = config.slack.actions.artists;

const DISPLAY_LIMIT = config.slack.limits.max_options;
const BUTTON = config.slack.buttons;

const ARTISTS_RESPONSES = {
  artist_panel: (title, url, genres, followers) => `<${url}|*${title}*>\n\n:notes: *Genres:* ${genres}\n\n:busts_in_silhouette: *Followers*: ${followers}\n`,
  error: ':warning: An error occured.',
  expired: ':information_source: Search has expired.',
  found: ':mag: Are these the artists you were looking for?',
  no_artists: (query) => `:information_source: No tracks found for the query "${query}"`,
  query_error: ':warning: Invalid query, please try again.',
  query_empty: ':information_source: No query entered. Please enter a query.',
};


module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, triggerId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);

  try {
    const artistSearch = await loadSearch(teamId, channelId, triggerId);
    if (!artistSearch) {
      return await reply(
          updateReply(ARTISTS_RESPONSES.expired, null),
          responseUrl,
      );
    }
    artistSearch.currentSearch += 1;
    const currentArtists = artistSearch.searchItems.splice(0, DISPLAY_LIMIT);
    const artistBlocks = currentArtists.map((artist) => {
      return [
        imageSection(
            ARTISTS_RESPONSES.artist_panel(artist.name, artist.url, artist.genres, artist.followers),
            artist.art,
            `Artist Art`,
        ),
        actionSection(
            null,
            [buttonActionElement(ARTIST_ACTIONS.view_artist_tracks, `View Artist Tracks`, artist.id, false, BUTTON.primary)],
        ),
      ];
    }).flat();

    const blocks = [
      textSection(ARTISTS_RESPONSES.found),
      ...artistBlocks,
      contextSection(null, `Page ${artistSearch.currentSearch}/${artistSearch.numSearches}`),
      actionSection(
          null,
          [
            ...artistSearch.currentSearch != artistSearch.numSearches ? [buttonActionElement(ARTIST_ACTIONS.see_more_artists, `Next 3 Artists`, triggerId, false)] : [],
            buttonActionElement(TRACK_ACTIONS.cancel_search, `Cancel Search`, triggerId, false, BUTTON.danger),
          ],
      ),
    ];
    await removeThreeSearches(teamId, channelId, triggerId);

    // This is an update request
    if (responseUrl) {
      await reply(
          updateReply(ARTISTS_RESPONSES.found, blocks),
          responseUrl,
      );
    } else {
      await postEphemeral(
          ephemeralPost(channelId, userId, ARTISTS_RESPONSES.found, blocks),
      );
    }
  } catch (error) {
    logger.error(error);
  }
};
