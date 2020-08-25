const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyPlayback = {
  shuffle: jest.fn(),
};
const mockSpotifyStatus = {
  fetchCurrentPlayback: jest.fn(),
};
const mockSpotifyHelper = {
  isPlaying: jest.fn(),
};
const mockSlackApi = {
  post: jest.fn(),
  postEphemeral: jest.fn(),
};
const mockSlackFormatReply = {
  ephemeralPost: jest.fn(),
  inChannelPost: jest.fn(),

};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback', () => mockSpotifyPlayback, {virtual: true});
jest.mock('/opt/spotify/spotify-helper', () => mockSpotifyHelper, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/control/control-shuffle');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId} = require('../../../data/request');
const status = require('../../../data/spotify/status');
const params = {
  0: {teamId, channelId, settings, userId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Shuffle', () => {
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
    it('should successfully toggle shuffle on', async () => {
      const auth = {auth: true};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying.mockReturnValueOnce(true);
      mockSpotifyPlayback.shuffle.mockResolvedValue();
      mockSlackApi.post.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[2]);
      expect(mockSpotifyPlayback.shuffle).toHaveBeenCalledWith(auth, true);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.on(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully toggle shuffle off', async () => {
      const auth = {auth: true};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValueOnce(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValueOnce(true);
      mockSpotifyPlayback.shuffle.mockResolvedValue();
      mockSlackApi.post.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[0]);
      expect(mockSpotifyPlayback.shuffle).toHaveBeenCalledWith(auth, false);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.off(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should report that Spotify is not playing', async () => {
      const auth = {auth: true};
      const post = {ephemeral: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValueOnce('');
      mockSpotifyHelper.isPlaying.mockReturnValueOnce(false);
      mockSlackApi.post.mockResolvedValue();
      mockSlackFormatReply.ephemeralPost.mockReturnValue(post);
      mockSlackApi.postEphemeral.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, '');
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.not_playing);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
    });

    it('should report toggling shuffle is not allowed', async () => {
      const auth = {auth: true};
      const post = {ephemeral: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValueOnce(status[3]);
      mockSpotifyHelper.isPlaying.mockReturnValueOnce(true);
      mockSlackApi.post.mockResolvedValue();
      mockSlackFormatReply.ephemeralPost.mockReturnValue(post);
      mockSlackApi.postEphemeral.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[3]);
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.cannot);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
    });
  });
});
