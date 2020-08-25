const logger = require('/opt/utils/util-logger');

// Slack
const {postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

// Settings
const {changeBlacklistRemove, loadBlacklist, changeBlacklist} = require('/opt/db/settings-extra-interface');
const RESPONSE = {
  failed: 'Blacklist failed to save',
  success: `:white_check_mark: Blacklisted successfully updated.`,
};

const main = async (teamId, channelId, userId, submissions) => {
  const blacklist = await loadBlacklist(teamId, channelId);
  const blacklistTracks = blacklist ? blacklist.blacklist : [];

  const [currentList, newSubmissions] = submissions.reduce(([curr, newSubs], submission) => {
    const track = blacklistTracks.find((track) => track.id === submission.value);
    return track ? [[...curr, track], newSubs] : [curr, [...newSubs, submission]];
  }, [[], []]);

  const tracksToRemove = currentList.length < blacklistTracks.length ? blacklistTracks.reduce((tracks, b, i) => {
    return !currentList.find((c) => b.id === c.id) ? [...tracks, i] : tracks;
  }, []) : [];

  if (tracksToRemove.length) {
    await changeBlacklistRemove(teamId, channelId, tracksToRemove);
  }

  if (newSubmissions.length) {
    const tracksToAdd = newSubmissions.map((track) => ({title: track.text.text, id: track.value}));
    await changeBlacklist(teamId, channelId, tracksToAdd);
  }

  const message = ephemeralPost(channelId, userId, RESPONSE.success);
  return await postEphemeral(message);
};


module.exports.handler = async (event, context) => {
  const {teamId, channelId, userId, submissions} = JSON.parse(event.Records[0].Sns.Message);
  return await main(teamId, channelId, userId, submissions)
      .catch(async (error)=>{
        logger.error(error, RESPONSE.failed);
        await reportErrorToSlack(channelId, userId, RESPONSE.failed);
      });
};
module.exports.RESPONSE = RESPONSE;
