const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyDevices = {
  fetchDevices: jest.fn(),
};
const mockSpotifyPlayback = {
  pause: jest.fn(),
};
const mockSpotifyStatus = {
  fetchCurrentPlayback: jest.fn(),
};
const mockSpotifyHelper = {
  isPlaying: jest.fn(),
};
const mockSlackApi = {
  post: jest.fn(),
};
const mockSlackFormatReply = {
  inChannelPost: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-devices', () => mockSpotifyDevices, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback', () => mockSpotifyPlayback, {virtual: true});
jest.mock('/opt/spotify/spotify-helper', () => mockSpotifyHelper, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/control/control-pause');
const response = mod.RESPONSE;
const {teamId, channelId, userId} = require('../../../data/request');
const devices = require('../../../data/spotify/device');
const status = require('../../../data/spotify/status');
const params = {
  0: {teamId, channelId, userId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Pause', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockAuthSession.authSession.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, null, response.failed);
    });
  });

  describe('main', () => {
    it('should successfully pause Spotify', async () => {
      const auth = {auth: true};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[0]);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[2])
          .mockResolvedValueOnce(status[0]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);
      mockSpotifyPlayback.pause.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[2]);
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(2, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(2, status[0]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should report that Spotify is already paused', async () => {
      const auth = {auth: true};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[0]);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValueOnce(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValueOnce(false);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.already);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should report that no Spotify devives are available', async () => {
      const auth = {auth: true};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[1]);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.no_devices);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should error when we pause Spotify but it does not pause', async () => {
      const auth = {auth: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[0]);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[2])
          .mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true);
      mockSpotifyPlayback.pause.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(1, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(1, status[2]);
      expect(mockSpotifyStatus.fetchCurrentPlayback).nthCalledWith(2, auth);
      expect(mockSpotifyHelper.isPlaying).nthCalledWith(2, status[2]);
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalled();
    });
  });
});
