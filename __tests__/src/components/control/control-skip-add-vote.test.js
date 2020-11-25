const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyStatus = {
  fetchCurrentPlayback: jest.fn(),
};
const mockSpotifyHelper = {
  isPlaying: jest.fn(),
};
const mockSpotifyTrack = jest.fn();
const mockSlackApi = {
  reply: jest.fn(),
  postEphemeral: jest.fn(),
};
const mockSlackBlocks = {
  textSection: jest.fn(),
};
const mockSlackFormatReply = {
  ephemeralPost: jest.fn(),
  updateReply: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockSkip = {
  addVote: jest.fn(),
};
const mockSettingsExtra = {
  loadSkip: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-helper', () => mockSpotifyHelper, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-track', () => mockSpotifyTrack, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackBlocks, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

jest.mock('/opt/control-skip/control-skip', () => mockSkip, {virtual: true});

jest.mock('/opt/db/settings-extra-interface', () => mockSettingsExtra, {virtual: true});

const mod = require('../../../../src/components/control/control-skip-add-vote');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId, responseUrl} = require('../../../data/request');
const status = require('../../../data/spotify/status');
const params = {
  0: {teamId, channelId, settings, userId, responseUrl},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Skip Add Vote', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockAuthSession.authSession.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, userId, response.failed);
    });
  });

  describe('main', () => {
    it('should successfully start a skip vote with no existing skip', async () => {
      const profile = {country: 'AU'};
      const auth = {auth: true, getProfile: () => profile};
      const track = {title: 'a title', id: 'id'};
      const skip = {skip: {track: {id: 'id'}}};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockSpotifyTrack.mockReturnValue(track);
      mockSettingsExtra.loadSkip.mockResolvedValue(skip);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSettingsExtra.loadSkip).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSkip.addVote).toHaveBeenCalledWith(teamId, channelId, auth, settings, userId, skip, track);
    });

    it('should report and update post with expired', async () => {
      const profile = {country: 'AU'};
      const auth = {auth: true, getProfile: () => profile};
      const track = {title: 'a title', id: 'id'};
      const textSection = {text: true};
      const reply = {update: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockSpotifyTrack.mockReturnValue(track);
      mockSettingsExtra.loadSkip.mockResolvedValue(null);
      mockSlackBlocks.textSection.mockReturnValue(textSection);
      mockSlackFormatReply.updateReply.mockReturnValue(reply);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSettingsExtra.loadSkip).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.expired);
      expect(mockSlackFormatReply.updateReply).toHaveBeenCalledWith(response.expired, [textSection]);
      expect(mockSlackApi.reply).toHaveBeenCalledWith(reply, responseUrl);
    });

    it('should report that Spotify is not playing', async () => {
      const profile = {country: 'AU'};
      const auth = {auth: true, getProfile: () => profile};
      const post = {ephemeral: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(false);
      mockSlackFormatReply.ephemeralPost.mockReturnValue(post);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.not_playing, null);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
    });
  });
});
