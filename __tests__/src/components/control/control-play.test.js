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
    'settings_helper': {
      'no_devices': 'no_devices',
      'no_devices_label': 'None',
      'create_new_playlist': 'create_new_playlist.',
    },
  },
  'spotify_api': {
    'playlists': {
      'limit': 50,
      'collaborative': true,
      'public': false,
      'tracks': {
        'limit': 100,
      },
    },
  },
};
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSns = {
  publish: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyDevices = {
  fetchDevices: jest.fn(),
};
const mockSpotifyPlayback = {
  play: jest.fn(),
};
const mockSpotifyStatus = {
  fetchCurrentPlayback: jest.fn(),
};
const mockSpotifyHelper = {
  isPlaying: jest.fn(),
};
const mockSlackApi = {
  post: jest.fn(),
  reply: jest.fn(),
};
const mockSlackFormatReply = {
  inChannelPost: jest.fn(),
  deleteReply: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockSpotifyPlaylists = {
  fetchPlaylistTotal: jest.fn(),
  fetchTracks: jest.fn(),
};
const mockPlaylistTrack = jest.fn();
const mockTrack = jest.fn();
const mockUtilTimeout = {
  sleep: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-devices', () => mockSpotifyDevices, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback', () => mockSpotifyPlayback, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-helper', () => mockSpotifyHelper, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-playlist-track', () => mockPlaylistTrack, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-track', () => mockTrack, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

jest.mock('/opt/utils/util-timeout', () => mockUtilTimeout, {virtual: true});

const mod = require('../../../../src/components/control/control-play');
const response = mod.RESPONSE;
const {teamId, channelId, userId, settings, settings2, responseUrl} = require('../../../data/request');
const devices = require('../../../data/spotify/device');
const status = require('../../../data/spotify/status');
const tracks = require('../../../data/spotify/tracks');
const params = {
  0: {teamId, channelId, userId, settings, responseUrl},
  1: {teamId, channelId, userId, settings: settings2}, // No device default device
  2: {teamId, channelId, userId, settings, responseUrl, trackUri: 'spotify:track:23TPP1eeElFfvYVznskwCY'},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Play', () => {
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
    beforeEach(() => {
      mockSns.publish.mockReturnThis();
    });
    it('should successfully play Spotify from the device already being used', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[0])
          .mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();
      mockSns.promise.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[0].device.id);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[2]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings}),
        TopicArn: process.env.SNS_PREFIX + 'tracks-current',
      });
    });
    it('should successfully play Spotify with the first available device and warn that the default device is not on', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const warning = {warning: true};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce('')
          .mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[0]);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost
          .mockReturnValueOnce(warning)
          .mockReturnValueOnce(post);
      mockSlackApi.post.mockResolvedValue();
      mockSns.promise.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith('');
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.no_default);
      expect(mockSlackApi.post).toHaveBeenCalledWith(warning);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, devices[0].devices[0].id);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[2]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings}),
        TopicArn: process.env.SNS_PREFIX + 'tracks-current',
      });
    });
    it('should successfully play Spotify with the device in settings', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce('')
          .mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[2]);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();
      mockSns.promise.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith('');
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, devices[2].devices[0].id);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[2]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings}),
        TopicArn: process.env.SNS_PREFIX + 'tracks-current',
      });
    });
    it('should successfully play Spotify with the no devices device option in settings', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce('')
          .mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[2]);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();
      mockSns.promise.mockResolvedValue();

      await expect(mod.handler(event(params[1]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith('');
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, devices[2].devices[0].id);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[2]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings: settings2}),
        TopicArn: process.env.SNS_PREFIX + 'tracks-current',
      });
    });
    it('should successfully play Spotify when it is stuck in unknown state', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};
      const total = {total: 69};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[0])
          .mockResolvedValueOnce(status[4])
          .mockResolvedValueOnce(status[2]);

      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();
      mockSns.promise.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[0].device.id);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[4]);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[0].device.id, settings.playlist.uri);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings}),
        TopicArn: process.env.SNS_PREFIX + 'tracks-current',
      });
    });
    it('should successfully play Spotify from a particular track', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};
      const total = {total: 6};
      const matchedUri = {uri: params[2].trackUri};
      const playlistTrack = {uri: 'not the track'};
      const playingTrack = {uri: matchedUri.uri, title: 'The Song'};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockReturnValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(matchedUri);
      mockTrack.mockReturnValue(playingTrack);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[0])
          .mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(true);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[2]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, country.country, 0, mockConfig.spotify_api.playlists.tracks.limit);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[0].device.id, settings.playlist.uri, {position: 4});
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[2]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success_track(playingTrack.title, userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
    it('should try to play Spotify from a particular track but track status is not track', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};
      const total = {total: 6};
      const matchedUri = {uri: params[2].trackUri};
      const playlistTrack = {uri: 'not the track'};
      const playingTrack = {uri: 'not', title: 'The Song'};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockReturnValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(matchedUri);
      mockTrack.mockReturnValue(playingTrack);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[0])
          .mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[2]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, country.country, 0, mockConfig.spotify_api.playlists.tracks.limit);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[0].device.id, settings.playlist.uri, {position: 4});
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[2]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.no_track);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
    it('should try to play from a particular track but playlist is empty', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};
      const total = {total: 0};
      const matchedUri = {uri: params[2].trackUri};
      const playlistTrack = {uri: 'not the track'};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockReturnValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(matchedUri);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[0])
          .mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(true);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[2]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.no_track);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
    it('should try to play from a particular track but cannot find it', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};
      const total = {total: 6};
      const playlistTrack = {uri: 'not the track'};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockReturnValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack.mockReturnValue(playlistTrack);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[0])
          .mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(true);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[2]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, country.country, 0, mockConfig.spotify_api.playlists.tracks.limit);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.no_track);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
    it('should report that the playlist is empty', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};
      const total = {total: 0};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[0])
          .mockResolvedValueOnce(status[4])
          .mockResolvedValueOnce(status[2]);

      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();
      mockSns.promise.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[0].device.id);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[4]);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.empty);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
    it('should throw an error when it hits the max attempts', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};
      const total = {total: 69};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback
          .mockResolvedValueOnce(status[0])
          .mockResolvedValueOnce(status[4])
          .mockResolvedValueOnce(status[2]);

      mockSpotifyHelper.isPlaying
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();
      mockSns.promise.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[0].device.id);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(1000);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[4]);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[0].device.id, settings.playlist.uri);
      expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, null, response.failed);
    });
    it('should report that there are no devices open', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValueOnce('');
      mockSpotifyHelper.isPlaying.mockReturnValueOnce(false);
      mockSpotifyDevices.fetchDevices.mockResolvedValue({devices: []});
      mockSpotifyPlayback.play.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValueOnce(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith('');
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.no_devices);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
    it('should report that Spotify is already playing', async () => {
      const country = {country: 'AU'};
      const auth = {auth: true, getProfile: () => country};
      const post = {inChannelPost: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValueOnce(status[2]);
      mockSpotifyHelper.isPlaying.mockReturnValueOnce(true);
      mockSlackFormatReply.inChannelPost.mockReturnValueOnce(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[2]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.already(status[2].device.volume_percent));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
  });
});
