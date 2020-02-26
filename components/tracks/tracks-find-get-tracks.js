const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);
const {loadTracks, changeTracks} = require('/opt/tracks/tracks-interface');
const {changeQuery, changeQueryValue, loadQuery} = require('/opt/tracks/tracks-model');
const {actionSection, buttonActionElement, contextSection, imageSection, textSection} = require('/opt/slack/format/slack-format-blocks');
const {postEphemeral, reply} = require('/opt/slack/slack-api');
const {ephemeralPost, updateReply} = require('/opt/slack/format/slack-format-reply');
const TRACK_ACTIONS = config.slack.actions.tracks;
const DISPLAY_LIMIT = config.slack.limits.max_options;
const BUTTON = config.slack.buttons;
const trackPanel = (title, url, artist, album, time) => `<${url}|*${title}*>\n:clock1: *Duration*: ${time}\n:studio_microphone: *Artists:* ${artist}\n:dvd: *Album*: ${album}\n`;

const TRACK_RESPONSE = {
  error: ':warning: An error occured.',
  expired: ':information_source: Search has expired.',
  found: ':mag: Are these the tracks you were looking for?',
};


module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, triggerId, responseUrl} = JSON.parse(event.Records[0].Sns.Message);
  try {
    const trackSearch = await loadTracks(teamId, channelId, triggerId, loadQuery);
    if (!trackSearch) {
      return await reply(
          updateReply(TRACK_RESPONSE.expired, null),
          responseUrl,
      );
    }
    trackSearch.currentSearch += 1;
    const currentTracks = trackSearch.searchItems.splice(0, DISPLAY_LIMIT);
    const trackBlocks = currentTracks.map((track) => {
      return [
        imageSection(
            trackPanel(track.name, track.url, track.artists, track.album, track.duration),
            track.art,
            `Album Art`,
        ),
        actionSection(
            null,
            [buttonActionElement(TRACK_ACTIONS.add_to_playlist, `+ Add to playlist`, track.id, false, BUTTON.primary)],
        ),
      ];
    }).flat();

    const blocks = [
      textSection(TRACK_RESPONSE.found),
      ...trackBlocks,
      contextSection(null, `Page ${trackSearch.currentSearch}/${trackSearch.numSearches}`),
      actionSection(
          null,
          [
            ...trackSearch.currentSearch != trackSearch.numSearches ? [buttonActionElement(TRACK_ACTIONS.see_more_results, `Next 3 Tracks`, triggerId, false)] : [],
            buttonActionElement(TRACK_ACTIONS.cancel_search, `Cancel Search`, triggerId, false, BUTTON.danger),
          ],
      ),
    ];
    await changeTracks(teamId, channelId, triggerId, changeQuery, changeQueryValue);

    // This is an update request
    if (responseUrl) {
      await reply(
          updateReply(TRACK_RESPONSE.found, blocks),
          responseUrl,
      );
    } else {
      await postEphemeral(
          ephemeralPost(channelId, userId, TRACK_RESPONSE.found, blocks),
      );
    }
  } catch (error) {
    logger.error(error);
    logger.error('Failed to get 3 tracks');
    try {
      await postEphemeral(
          ephemeralPost(channelId, userId, TRACK_RESPONSE.error, null),
      );
    } catch (error2) {
      logger.error(error2);
      logger.error('Failed to report get 3 tracks error');
    }
  }
};
