const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');

// Spotify
const authSession = require('/opt/spotify/spotify-auth/spotify-auth-session');
const {fetchCurrentPlayback} = require('/opt/spotify/spotify-api/spotify-api-playback-status');
const {fetchPlaylistTotal} = require('/opt/spotify/spotify-api/spotify-api-playlists');
const {play} = require('/opt/spotify/spotify-api/spotify-api-playback');
const {isPlaying, onPlaylist} = require('/opt/spotify/spotify-helper');

// Util
const {sleep} = require('/opt/utils/util-timeout');

// Slack
const {post, postEphemeral} = require('/opt/slack/slack-api');
const {ephemeralPost, inChannelPost} = require('/opt/slack/format/slack-format-reply');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

const PLAYLIST = config.dynamodb.settings.playlist;

const JUMP_RESPONSE = {
  failed: 'Jump to the start of playlist failed',
  not_playing: ':information_source: Spotify is currently not playing. Please play Spotify first.',
  success: (userId) => `:arrow_forward: Spotify is now playing from the start of the playlist. Set by <@${userId}>.`,
  fail: ':warning: Spotify failed to jump to the start of the playlist.',
  empty: ':information_source: The Spotbot playlist is empty. Please add tracks before trying to jumping back to the playlist.',
};

const startJump = async (teamId, channelId, settings, userId) => {
  const auth = await authSession(teamId, channelId);
  const playlist = settings[PLAYLIST];
  const status = await fetchCurrentPlayback(teamId, channelId, auth);

  if (!isPlaying(status)) {
    const message = ephemeralPost(channelId, userId, JUMP_RESPONSE.not_playing);
    return await postEphemeral(message);
  }

  const {tracks: {total}} = await fetchPlaylistTotal(teamId, channelId, auth, playlist.id);
  if (!total) {
    const message = ephemeralPost(channelId, userId, JUMP_RESPONSE.empty);
    return await postEphemeral(message);
  }

  await play(teamId, channelId, auth, status.device.id, playlist.uri);
  await sleep(2000);

  if (isPlaying(status) && onPlaylist(status, playlist)) {
    const message = inChannelPost(channelId, JUMP_RESPONSE.success(userId));
    return await post(message);
  }
  const message = inChannelPost(channelId, JUMP_RESPONSE.fail);
  return await post(message);
};

module.exports.handler = async (event, context) => {
  const {teamId, channelId, settings, userId} = JSON.parse(event.Records[0].Sns.Message);
  await startJump(teamId, channelId, settings, userId)
      .catch((error)=>{
        logger.error(error, JUMP_RESPONSE.failed);
        reportErrorToSlack(teamId, channelId, null, JUMP_RESPONSE.failed);
      });
};
