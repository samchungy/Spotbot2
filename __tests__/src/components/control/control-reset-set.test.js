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
  'slack': {
    'actions': {
      'blacklist_modal': 'blacklist_modal',
      'sonos_modal': 'sonos_modal',
      'settings_modal': 'settings_modal',
      'device_modal': 'device_modal',
      'empty_modal': 'empty_modal',
      'remove_modal': 'remove_modal',
      'reset_modal': 'reset_modal',
      'playlist': 'playlist',
      'block_actions': 'block_actions',
      'view_submission': 'view_submission',
      'view_closed': 'view_closed',
      'controller': 'controller',
      'controller_overflow': 'controller_overflow',
      'reset_review_confirm': 'reset_review_confirm',
      'reset_review_deny': 'reset_review_deny',
      'reset_review_jump': 'reset_review_jump',
      'controls': {
        'play': 'play',
        'pause': 'pause',
        'skip': 'skip',
        'reset': 'reset',
        'clear_one': 'clear_one',
        'jump_to_start': 'jump_to_start',
        'shuffle': 'shuffle',
        'repeat': 'repeat',
      },
      'skip_vote': 'skip_vote',
      'tracks': {
        'add_to_playlist': 'add_to_playlist',
        'see_more_results': 'see_more_results',
        'cancel_search': 'cancel_search',
      },
      'artists': {
        'view_artist_tracks': 'view_artist_tracks',
        'see_more_artists': 'see_more_artists',
      },
    },
    'buttons': {
      'primary': 'primary',
      'danger': 'danger',
    },
  },
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
const mockSpotifyPlaylists = {
  fetchPlaylistTotal: jest.fn(),
  deleteTracks: jest.fn(),
  fetchTracks: jest.fn(),
  replaceTracks: jest.fn(),
};
const mockSlackApi = {
  post: jest.fn(),
  reply: jest.fn(),
};
const mockSlackFormatReply = {
  deleteReply: jest.fn(),
  inChannelPost: jest.fn(),
};
const mockSlackBlocks = {
  actionSection: jest.fn(),
  buttonActionElement: jest.fn(),
  textSection: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockResetLayer = {
  getReviewTracks: jest.fn(),
};
const mockPlaylistTrack = jest.fn();

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-playlist-track', () => mockPlaylistTrack, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});
jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackBlocks, {virtual: true});

jest.mock('../../../../src/components/control/layers/control-reset', () => mockResetLayer, {virtual: true});

const mod = require('../../../../src/components/control/control-reset-set');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId, responseUrl} = require('../../../data/request');
const params = {
  0: {teamId, channelId, settings, userId},
  1: {teamId, channelId, settings, userId, responseUrl},
  2: {teamId, channelId, settings, userId, responseUrl, jump: true},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Reset Set', () => {
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
    it('should successfully reset the whole playlist', async () => {
      const auth = {auth: true};
      const post = {inChannel: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.replaceTracks.mockResolvedValue();
      mockSpotifyPlaylists.deleteTracks.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.replaceTracks).toHaveBeenCalledWith(auth, settings.playlist.id, [mockConfig.spotify_api.africa]);
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, [{uri: mockConfig.spotify_api.africa}]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully reset the whole playlist and delete the slack post', async () => {
      const auth = {auth: true};
      const post = {inChannel: true};
      const reply = {delete: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSlackFormatReply.deleteReply.mockReturnValue(reply);
      mockSpotifyPlaylists.replaceTracks.mockResolvedValue();
      mockSpotifyPlaylists.deleteTracks.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[1]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
      expect(mockSlackApi.reply).toHaveBeenCalledWith(reply, responseUrl);
      expect(mockSpotifyPlaylists.replaceTracks).toHaveBeenCalledWith(auth, settings.playlist.id, [mockConfig.spotify_api.africa]);
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, [{uri: mockConfig.spotify_api.africa}]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success(userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully reset the playlist keeping specific tracks', async () => {
      const auth = {auth: true};
      const post = {inChannel: true};
      const uris = ['uri1', 'uri2', 'uri2'];
      const tracks = ['track1', 'track2', 'track3'];
      const tracks2 = [...uris, ...tracks];
      const playlistTrack = {uri: 'uri'};
      const matched = {uri: 'uri1'};
      const total = {total: 103};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValueOnce(total);
      mockSpotifyPlaylists.fetchTracks
          .mockResolvedValueOnce({items: tracks})
          .mockResolvedValueOnce({items: tracks2});
      mockSpotifyPlaylists.deleteTracks.mockResolvedValue();
      mockPlaylistTrack
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(matched)
          .mockReturnValueOnce(matched)
          .mockReturnValueOnce(matched)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack);

      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event({...params[0], trackUris: uris}))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0, total.total - mockConfig.spotify_api.playlists.tracks.limit);
      tracks.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, tracks.map((t, i) => ({
        uri: playlistTrack.uri,
        positions: [i],
      })));
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0);
      tracks2.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, tracks.map((t, i) => ({
        uri: playlistTrack.uri,
        positions: [uris.length + i],
      })));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.kept(uris, userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully reset the playlist and ignore second fetchTracks returning nothing', async () => {
      const auth = {auth: true};
      const post = {inChannel: true};
      const uris = ['uri1', 'uri2', 'uri2'];
      const tracks = ['track1', 'track2', 'track3'];
      const playlistTrack = {uri: 'uri'};
      const total = {total: 103};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValueOnce(total);
      mockSpotifyPlaylists.fetchTracks
          .mockResolvedValueOnce({items: tracks})
          .mockResolvedValueOnce({items: []});
      mockSpotifyPlaylists.deleteTracks.mockResolvedValue();
      mockPlaylistTrack
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack);

      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event({...params[0], trackUris: uris}))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0, total.total - mockConfig.spotify_api.playlists.tracks.limit);
      tracks.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, tracks.map((t, i) => ({
        uri: playlistTrack.uri,
        positions: [i],
      })));
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.kept(uris, userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully reset the playlist keeping specific tracks and jump', async () => {
      const auth = {auth: true};
      const post = {inChannel: true};
      const uris = ['uri1', 'uri2', 'uri2'];
      const tracks = ['track1', 'track2', 'track3'];
      const tracks2 = [...uris, ...tracks];
      const playlistTrack = {uri: 'uri'};
      const matched = {uri: 'uri1'};
      const total = {total: 103};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValueOnce(total);
      mockSpotifyPlaylists.fetchTracks
          .mockResolvedValueOnce({items: tracks})
          .mockResolvedValueOnce({items: tracks2});
      mockSpotifyPlaylists.deleteTracks.mockResolvedValue();
      mockPlaylistTrack
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(matched)
          .mockReturnValueOnce(matched)
          .mockReturnValueOnce(matched)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack);

      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event({...params[2], trackUris: uris}))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0, total.total - mockConfig.spotify_api.playlists.tracks.limit);
      tracks.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, tracks.map((t, i) => ({
        uri: playlistTrack.uri,
        positions: [i],
      })));
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0);
      tracks2.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, tracks.map((t, i) => ({
        uri: playlistTrack.uri,
        positions: [uris.length + i],
      })));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.kept(uris, userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings, userId}),
        TopicArn: process.env.SNS_PREFIX + 'control-jump',
      });
      expect(mockSns.promise).toHaveBeenCalled();
    });

    it('should successfully reset the playlist keeping only 1 track', async () => {
      const auth = {auth: true};
      const post = {inChannel: true};
      const uris = ['uri1'];
      const tracks = ['track1', 'track2', 'track3'];
      const tracks2 = [...uris, ...tracks];
      const playlistTrack = {uri: 'uri'};
      const matched = {uri: 'uri1'};
      const total = {total: 103};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValueOnce(total);
      mockSpotifyPlaylists.fetchTracks
          .mockResolvedValueOnce({items: tracks})
          .mockResolvedValueOnce({items: tracks2});
      mockSpotifyPlaylists.deleteTracks.mockResolvedValue();
      mockPlaylistTrack
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(matched)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack);

      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event({...params[0], trackUris: uris}))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0, total.total - mockConfig.spotify_api.playlists.tracks.limit);
      tracks.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, tracks.map((t, i) => ({
        uri: playlistTrack.uri,
        positions: [i],
      })));
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0);
      tracks2.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, tracks.map((t, i) => ({
        uri: playlistTrack.uri,
        positions: [uris.length + i],
      })));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.kept(uris, userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully reduce from 200+ tracks and then keep 1 track', async () => {
      const auth = {auth: true};
      const post = {inChannel: true};
      const uris = ['uri1'];
      const tracks = ['track1', 'track2', 'track3'];
      const tracks2 = [...uris, ...tracks];
      const playlistTrack = {uri: 'uri'};
      const matched = {uri: 'uri1'};
      const total = {total: 203};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValueOnce(total);
      mockSpotifyPlaylists.fetchTracks
          .mockResolvedValueOnce({items: tracks})
          .mockResolvedValueOnce({items: tracks})
          .mockResolvedValueOnce({items: tracks2});
      mockSpotifyPlaylists.deleteTracks.mockResolvedValue();
      mockPlaylistTrack
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(matched)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack);

      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event({...params[0], trackUris: uris}))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenNthCalledWith(1, auth, settings.playlist.id, null, 0, mockConfig.spotify_api.playlists.tracks.limit);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenNthCalledWith(2, auth, settings.playlist.id, null, 0, total.total - (2* mockConfig.spotify_api.playlists.tracks.limit));
      tracks.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, tracks.map((t, i) => ({
        uri: playlistTrack.uri,
        positions: [i],
      })));
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenNthCalledWith(3, auth, settings.playlist.id, null, 0);
      tracks2.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, tracks.map((t, i) => ({
        uri: playlistTrack.uri,
        positions: [uris.length + i],
      })));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.kept(uris, userId));
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
  });
});
