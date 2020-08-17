const mockConfig = {
  'dynamodb': {
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
const mockMoment = {
  tz: jest.fn().mockReturnThis(),
  format: jest.fn(),
  add: jest.fn(),
  unix: jest.fn(),
  names: jest.fn(),
  subtract: jest.fn(),
  isBefore: jest.fn(),
  isAfter: jest.fn(),
  isSameOrAfter: jest.fn(),
};
const mockMom = jest.fn(() => mockMoment);
mockMom.tz = jest.fn(() => mockMoment);
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
  post: jest.fn(),
};
const mockSlackFormatReply = {
  inChannelPost: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockSkip = {
  addVote: jest.fn(),
  getSkipBlock: jest.fn(),
  onBlacklist: jest.fn(),
  skipTrack: jest.fn(),
};
const mockSettingsExtra = {
  createNewSkip: jest.fn(),
  loadSkip: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-helper', () => mockSpotifyHelper, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-track', () => mockSpotifyTrack, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

jest.mock('/opt/control-skip/control-skip', () => mockSkip, {virtual: true});

jest.mock('/opt/db/settings-extra-interface', () => mockSettingsExtra, {virtual: true});

const mod = require('../../../../src/components/control/control-skip-start');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId, settings2} = require('../../../data/request');
const status = require('../../../data/spotify/status');
const params = {
  0: {teamId, channelId, settings, userId},
  1: {teamId, channelId, settings: settings2, userId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Skip Start', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockAuthSession.authSession.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
    });
  });

  describe('main', () => {
    beforeEach(() => {
      mockMom.mockImplementation(() => mockMoment);
      mockMom.tz.mockImplementation(() => mockMoment);
    });
    it('should successfully start a skip vote with no existing skip', async () => {
      const profile = {country: 'AU'};
      const auth = {auth: true, getProfile: () => profile};
      const track = {title: 'a title', id: 'id'};
      const today = '2020-08-16';
      const tz = {moment: true};
      const post = {inChannel: true};
      const block = {skip: true};
      const postPayload = {message: {ts: 'ts'}};
      // const skip = {skip: {track: {id: 'id'}}};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockSpotifyTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSettingsExtra.loadSkip.mockResolvedValue(null);
      mockMoment.tz.mockReturnThis();
      mockMoment.format.mockReturnValue(today);
      mockMom.tz.mockReturnValue(tz);
      mockMoment.isBefore.mockReturnValue(false);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSkip.getSkipBlock.mockReturnValue(block);
      mockSlackApi.post.mockResolvedValue(postPayload);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSettingsExtra.loadSkip).toHaveBeenCalledWith(teamId, channelId);
      expect(mockMoment.tz).toHaveBeenCalledWith(settings.timezone);
      expect(mockMoment.format).toHaveBeenCalledWith('YYYY-MM-DD');
      expect(mockMom.tz).toHaveBeenCalledWith(`${today} 06:00`, settings.timezone);
      expect(mockMom.tz).toHaveBeenCalledWith(`${today} 18:00`, settings.timezone);
      expect(mockMoment.isBefore).toHaveBeenCalledWith(tz);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.request(userId, track.title), block);
      expect(mockSkip.getSkipBlock).toHaveBeenCalledWith(userId, parseInt(settings.skip_votes), track.title, track.id, [userId]);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      expect(mockSettingsExtra.createNewSkip).toHaveBeenCalledWith(teamId, channelId, postPayload.message.ts, track, [userId], parseInt(settings.skip_votes) + 1);
    });

    it('should successfully start a skip vote with no existing skip using After Hours setting', async () => {
      const profile = {country: 'AU'};
      const auth = {auth: true, getProfile: () => profile};
      const track = {title: 'a title', id: 'id'};
      const today = '2020-08-16';
      const tz = {moment: true};
      const post = {inChannel: true};
      const block = {skip: true};
      const postPayload = {message: {ts: 'ts'}};
      // const skip = {skip: {track: {id: 'id'}}};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockSpotifyTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSettingsExtra.loadSkip.mockResolvedValue(null);
      mockMoment.tz.mockReturnThis();
      mockMoment.format.mockReturnValue(today);
      mockMom.tz.mockReturnValue(tz);
      mockMoment.isBefore.mockReturnValue(true);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSkip.getSkipBlock.mockReturnValue(block);
      mockSlackApi.post.mockResolvedValue(postPayload);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSettingsExtra.loadSkip).toHaveBeenCalledWith(teamId, channelId);
      expect(mockMoment.tz).toHaveBeenCalledWith(settings.timezone);
      expect(mockMoment.format).toHaveBeenCalledWith('YYYY-MM-DD');
      expect(mockMom.tz).toHaveBeenCalledWith(`${today} 06:00`, settings.timezone);
      expect(mockMoment.isBefore).toHaveBeenCalledWith(tz);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.request(userId, track.title), block);
      expect(mockSkip.getSkipBlock).toHaveBeenCalledWith(userId, parseInt(settings.skip_votes_ah), track.title, track.id, [userId]);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      expect(mockSettingsExtra.createNewSkip).toHaveBeenCalledWith(teamId, channelId, postPayload.message.ts, track, [userId], parseInt(settings.skip_votes_ah) + 1);
    });

    it('should resolve and let blacklist logic handle it', async () => {
      const profile = {country: 'AU'};
      const auth = {auth: true, getProfile: () => profile};
      const track = {title: 'a title', id: 'id'};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockSpotifyTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(true);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
    });

    it('should skip as the settings do not require any extra votes', async () => {
      const profile = {country: 'AU'};
      const auth = {auth: true, getProfile: () => profile};
      const track = {title: 'a title', id: 'id'};
      const today = '2020-08-16';
      const tz = {moment: true};
      const post = {inChannel: true};
      const block = {skip: true};
      const postPayload = {message: {ts: 'ts'}};
      // const skip = {skip: {track: {id: 'id'}}};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockSpotifyTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSettingsExtra.loadSkip.mockResolvedValue(null);
      mockMoment.tz.mockReturnThis();
      mockMoment.format.mockReturnValue(today);
      mockMom.tz.mockReturnValue(tz);
      mockMoment.isBefore.mockReturnValue(false);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSkip.getSkipBlock.mockReturnValue(block);
      mockSlackApi.post.mockResolvedValue(postPayload);

      await expect(mod.handler(event(params[1]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings2, settings2.playlist, status[0], track);
      expect(mockSettingsExtra.loadSkip).toHaveBeenCalledWith(teamId, channelId);
      expect(mockMoment.tz).toHaveBeenCalledWith(settings.timezone);
      expect(mockMoment.format).toHaveBeenCalledWith('YYYY-MM-DD');
      expect(mockMom.tz).toHaveBeenCalledWith(`${today} 06:00`, settings2.timezone);
      expect(mockMom.tz).toHaveBeenCalledWith(`${today} 18:00`, settings2.timezone);
      expect(mockMoment.isBefore).toHaveBeenCalledWith(tz);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.confirmation(track.title, [userId]));
      expect(mockSkip.skipTrack).toHaveBeenCalledWith(teamId, channelId, auth, settings2, track);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should load a skip vote and call addVote', async () => {
      const profile = {country: 'AU'};
      const auth = {auth: true, getProfile: () => profile};
      const track = {title: 'a title', id: 'id'};
      const skip = {skip: {track: {id: 'id'}}};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockSpotifyTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSettingsExtra.loadSkip.mockResolvedValue(skip);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSettingsExtra.loadSkip).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSkip.addVote).toHaveBeenCalledWith(teamId, channelId, auth, settings, userId, skip, track);
    });

    it('should report that Spotify is not playing', async () => {
      const profile = {country: 'AU'};
      const auth = {auth: true, getProfile: () => profile};
      const post = {inChannel: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(false);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.not_playing);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
  });
});
