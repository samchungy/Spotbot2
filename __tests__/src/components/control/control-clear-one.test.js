const mockConfig = {
  'spotify_api': {
    'maximum_request_attempts': 3,
    'scopes': [
      'user-read-private',
      'user-read-email',
      'user-read-recently-played',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-collaborative',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
      'streaming',
    ],
    'playlists': {
      'limit': 50,
      'collaborative': true,
      'public': false,
      'tracks': {
        'limit': 100,
      },
    },
    'africa': 'spotify:track:2374M0fQpWi3dLnB54qaLX',
    'tracks': {
      'limit': 24,
      'info_limit': 50,
    },
    'recent_limit': 5,
  },
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
// Mock Modules
const mockMoment = {
  isAfter: jest.fn(),
  tz: jest.fn().mockReturnThis(),
  format: jest.fn(),
  add: jest.fn(),
  subtract: jest.fn(),
  unix: jest.fn(),
  names: jest.fn(),
};
const mockMom = () => mockMoment;
mockMom.tz = jest.fn(() => mockMoment);
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyPlaylists = {
  deleteTracks: jest.fn(),
  fetchTracks: jest.fn(),
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
const mockUtilTrack = jest.fn();

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-playlist-track', () => mockUtilTrack, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/control/control-clear-one');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId} = require('../../../data/request');
const tracks = require('../../../data/spotify/tracks');
const params = {
  0: {teamId, channelId, settings, userId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Clear One', () => {
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
    it('should successfully clear tracks older than one day', async () => {
      const auth = {auth: true};
      const playlistTrack = {track: true, addedAt: 'date', uri: 'track'};
      const post = {inChannel: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockMoment.subtract.mockReturnThis();
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockUtilTrack.mockReturnValue(playlistTrack);
      mockMoment.isAfter
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(false);
      mockSpotifyPlaylists.deleteTracks.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();


      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockMoment.subtract).toHaveBeenCalledWith('1', 'day');
      tracks[0].items.forEach((t) => {
        expect(mockUtilTrack).toHaveBeenCalledWith(t);
        expect(mockMoment.isAfter).toHaveBeenCalledWith(playlistTrack.addedAt);
      });
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, [
        {uri: playlistTrack.uri, positions: [0]},
        {uri: playlistTrack.uri, positions: [1]},
        {uri: playlistTrack.uri, positions: [2]},
      ]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully clear > 100 tracks older than one day', async () => {
      const manyTracks = {items: new Array(100).fill().map(() => tracks[0].items[Math.floor(Math.random() * tracks[0].items.length)])};
      const auth = {auth: true};
      const playlistTrack = {track: true, addedAt: 'date', uri: 'track'};
      const post = {inChannel: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockMoment.subtract.mockReturnThis();
      mockSpotifyPlaylists.fetchTracks
          .mockResolvedValueOnce(manyTracks)
          .mockResolvedValueOnce(tracks[0]);
      mockUtilTrack.mockReturnValue(playlistTrack);
      mockMoment.isAfter.mockReturnValue(true);
      mockSpotifyPlaylists.deleteTracks.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();


      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockMoment.subtract).toHaveBeenCalledWith('1', 'day');
      expect(mockUtilTrack).toHaveBeenCalledTimes(manyTracks.items.length + tracks[0].items.length);
      expect(mockMoment.isAfter).toHaveBeenCalledTimes(manyTracks.items.length + tracks[0].items.length);
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, manyTracks.items.map((t, i) => ({uri: playlistTrack.uri, positions: [i]})));
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, tracks[0].items.map((t, i) => ({uri: playlistTrack.uri, positions: [i]})));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
  });
});
