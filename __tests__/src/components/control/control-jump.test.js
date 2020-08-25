const mockConfig = {
  dynamodb: {
    'settings': {
      'channel_admins': 'channel_admins',
      'playlist': 'playlist',
      'default_device': 'default_device',
      'disable_repeats_duration': 'disable_repeats_duration',
      'back_to_playlist': 'back_to_playlist',
      'skip_votes': 'skip_votes',
      'skip_votes_ah': 'skip_votes_ah',
      'timezone': 'timezone',
      'ghost_mode': 'ghost_mode',
    },
  },
};
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyPlayback = {
  play: jest.fn(),
};
const mockSpotifyStatus = {
  fetchCurrentPlayback: jest.fn(),
};
const mockSpotifyHelper = {
  isPlaying: jest.fn(),
  onPlaylist: jest.fn(),
};
const mockSpotifyPlaylists = {
  fetchPlaylistTotal: jest.fn(),
};
const mockSlackApi = {
  reply: jest.fn(),
  post: jest.fn(),
  postEphemeral: jest.fn(),
};
const mockSlackFormatReply = {
  deleteReply: jest.fn(),
  ephemeralPost: jest.fn(),
  inChannelPost: jest.fn(),

};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockUtilTimeout = {
  sleep: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback', () => mockSpotifyPlayback, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-helper', () => mockSpotifyHelper, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

jest.mock('/opt/utils/util-timeout', () => mockUtilTimeout, {virtual: true});

const mod = require('../../../../src/components/control/control-jump');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId, responseUrl} = require('../../../data/request');
const status = require('../../../data/spotify/status');
const params = {
  0: {teamId, channelId, settings, userId},
  1: {teamId, channelId, settings, userId, responseUrl},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Jump', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockAuthSession.authSession.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, null, response.failed);
    });
  });

  describe('main', () => {
    it('should successfully jump back to playlist on Spotify', async () => {
      const auth = {auth: true};
      const post = {inChannelPost: true};
      const total = {total: 139};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[2])
          .mockResolvedValueOnce(status[0]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackApi.post.mockResolvedValue();
      mockUtilTimeout.sleep.mockResolvedValue();
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[2]);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[2].device.id, settings.playlist.uri);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(2, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(2, status[0]);
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully jump back to playlist on Spotify and delete reply', async () => {
      const auth = {auth: true};
      const post = {inChannelPost: true};
      const total = {total: 139};
      const reply = {delete: true};

      mockSlackFormatReply.deleteReply.mockReturnValue(reply);
      mockSlackApi.reply.mockResolvedValue();
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[2])
          .mockResolvedValueOnce(status[0]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackApi.post.mockResolvedValue();
      mockUtilTimeout.sleep.mockResolvedValue();
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[1]))).resolves.toBe();
      expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
      expect(mockSlackApi.reply).toHaveBeenCalledWith(reply, responseUrl);
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[2]);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[2].device.id, settings.playlist.uri);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(2, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(2, status[0]);
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should ask to play Spotify first', async () => {
      const auth = {auth: true};
      const post = {ephemeral: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying.mockReturnValueOnce(false);
      mockSlackFormatReply.ephemeralPost.mockReturnValue(post);
      mockSlackApi.postEphemeral.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[2]);
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.not_playing);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
    });

    it('should report that the playlist is empty', async () => {
      const auth = {auth: true};
      const post = {inChannelPost: true};
      const total = {total: 0};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying.mockReturnValueOnce(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.ephemeralPost.mockReturnValue(post);
      mockSlackApi.postEphemeral.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[2]);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.empty);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
    });

    it('should trigger play but status is not playing', async () => {
      const auth = {auth: true};
      const post = {inChannelPost: true};
      const total = {total: 139};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[2])
          .mockResolvedValueOnce(status[0]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackApi.post.mockResolvedValue();
      mockUtilTimeout.sleep.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[2]);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[2].device.id, settings.playlist.uri);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(2, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(2, status[0]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.fail);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should trigger play but status is not on playlist', async () => {
      const auth = {auth: true};
      const post = {inChannelPost: true};
      const total = {total: 139};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[2])
          .mockResolvedValueOnce(status[0]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackApi.post.mockResolvedValue();
      mockUtilTimeout.sleep.mockResolvedValue();
      mockSpotifyHelper.onPlaylist.mockReturnValue(false);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[2]);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[2].device.id, settings.playlist.uri);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(2, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(2, status[0]);
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.fail);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
  });
});
