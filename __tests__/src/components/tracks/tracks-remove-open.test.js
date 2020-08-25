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
        'play_close': 'play_close',
        'play_track': 'play_track',
        'pause': 'pause',
        'skip': 'skip',
        'reset': 'reset',
        'clear_one': 'clear_one',
        'jump_to_start': 'jump_to_start',
        'jump_to_start_close': 'jump_to_start_close',
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
  },
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSpotifyPlaylists = {
  fetchPlaylistTotal: jest.fn(),
  fetchTracks: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockHistoryInterface = {
  searchUserTrackHistory: jest.fn(),
};
const mockSlackApi = {
  updateModal: jest.fn(),
};
const mockSlackModal = {
  multiSelectStatic: jest.fn(),
  option: jest.fn(),
  slackModal: jest.fn(),
};
const mockSlackBlocks = {
  textSection: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockPlaylistTrack = jest.fn();

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-playlist-track', () => mockPlaylistTrack, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/db/history-interface', () => mockHistoryInterface, {virtual: true});

jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackBlocks, {virtual: true});
jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackModal, {virtual: true});
jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/tracks/tracks-remove-open');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId, viewId} = require('../../../data/request');
const tracks = require('../../../data/spotify/tracks');
const params = {
  0: {teamId, channelId, settings, userId, viewId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Tracks Remove Open', () => {
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

  describe('Main', () => {
    const profile = {id: 'profile-id', country: 'AU'};
    const auth = {auth: true, getProfile: () => profile};
    const playlistTrack = {uri: 'test', id: 'test', title: 'a title', addedBy: {id: 'profile-id'}};
    const queryTrack = {id: 'test'};
    const option = {option: true};
    const selectStatic = {groups: true};
    const modal = {modal: true};
    const text = {text: true};
    it('should open a track remove modal', async () => {
      const total = {total: 6};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack.mockReturnValue(playlistTrack);
      mockHistoryInterface.searchUserTrackHistory.mockResolvedValue([queryTrack]);
      mockSlackModal.option.mockReturnValue(option);
      mockSlackModal.multiSelectStatic.mockReturnValue(selectStatic);
      mockSlackModal.slackModal.mockReturnValue(modal);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, profile.country, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockHistoryInterface.searchUserTrackHistory).toHaveBeenCalledWith(teamId, channelId, userId, ['test']);
      expect(mockSlackModal.option).toHaveBeenCalledWith(playlistTrack.title, playlistTrack.uri);
      expect(mockSlackModal.multiSelectStatic).toHaveBeenCalledWith(mockConfig.slack.actions.remove_modal, `Select Tracks to Remove`, 'Selected tracks will be removed when you click Confirm', null, [option]);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.remove_modal, `Remove Tracks`, `Confirm`, `Close`, [selectStatic], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should open a track remove modal with a couple tracks', async () => {
      const total = {total: 6};
      const playlistTrack2 = {id: 'test2', title: 'a title', addedBy: {id: 'profile-id'}};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack)
          .mockReturnValueOnce(playlistTrack2)
          .mockReturnValue(playlistTrack);

      mockHistoryInterface.searchUserTrackHistory.mockResolvedValue([queryTrack]);
      mockSlackModal.option.mockReturnValue(option);
      mockSlackModal.multiSelectStatic.mockReturnValue(selectStatic);
      mockSlackModal.slackModal.mockReturnValue(modal);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, profile.country, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockHistoryInterface.searchUserTrackHistory).toHaveBeenCalledWith(teamId, channelId, userId, ['test', 'test2']);
      expect(mockSlackModal.option).toHaveBeenCalledWith(playlistTrack.title, playlistTrack.uri);
      expect(mockSlackModal.multiSelectStatic).toHaveBeenCalledWith(mockConfig.slack.actions.remove_modal, `Select Tracks to Remove`, 'Selected tracks will be removed when you click Confirm', null, [option]);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.remove_modal, `Remove Tracks`, `Confirm`, `Close`, [selectStatic], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should open a track remove modal containing more than one different options', async () => {
      const total = {total: 6};
      const manyTracks = {items: new Array(100).fill().map(() => tracks[0].items[Math.floor(Math.random() * tracks[0].items.length)])};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(manyTracks);
      manyTracks.items.forEach((t, i) => mockPlaylistTrack.mockReturnValueOnce({id: 'test' + i, uri: 'test' + i, title: 'a title', addedBy: {id: 'profile-id'}}));
      mockHistoryInterface.searchUserTrackHistory
          .mockResolvedValueOnce(manyTracks.items.reduce((acc, t, i) => i <= 98 ? acc.concat({id: 'test'+i}) : acc, []))
          .mockResolvedValueOnce([{id: 'test99'}]);
      mockSlackModal.option.mockReturnValue(option);
      mockSlackModal.multiSelectStatic.mockReturnValue(selectStatic);
      mockSlackModal.slackModal.mockReturnValue(modal);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, profile.country, 0);
      manyTracks.items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockHistoryInterface.searchUserTrackHistory).toHaveBeenCalledWith(teamId, channelId, userId, manyTracks.items.reduce((acc, t, i) => i <= 98 ? acc.concat('test'+i) : acc, []));
      expect(mockHistoryInterface.searchUserTrackHistory).toHaveBeenCalledWith(teamId, channelId, userId, ['test99']);
      manyTracks.items.forEach((t, i) => expect(mockSlackModal.option).toHaveBeenCalledWith('a title', 'test' + i));
      expect(mockSlackModal.multiSelectStatic).toHaveBeenCalledWith(mockConfig.slack.actions.remove_modal, `Select Tracks to Remove`, 'Selected tracks will be removed when you click Confirm', null, manyTracks.items.map(() => option));
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.remove_modal, `Remove Tracks`, `Confirm`, `Close`, [selectStatic], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should report empty playlist', async () => {
      const total = {total: 0};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSlackBlocks.textSection.mockReturnValue(text);
      mockSlackModal.slackModal.mockReturnValue(modal);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.no_tracks);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.remove_modal, `Remove Tracks`, null, `Close`, [text], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should report an empty playlist when fetch fails', async () => {
      const total = {total: 6};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue({items: []});
      mockSlackBlocks.textSection.mockReturnValue(text);
      mockSlackModal.slackModal.mockReturnValue(modal);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, profile.country, 0);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.no_tracks);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.remove_modal, `Remove Tracks`, null, `Close`, [text], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should fail to finds tracks added by user', async () => {
      const total = {total: 6};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack.mockReturnValue(playlistTrack);
      mockHistoryInterface.searchUserTrackHistory.mockResolvedValue([]);
      mockSlackModal.option.mockReturnValue(option);
      mockSlackModal.multiSelectStatic.mockReturnValue(selectStatic);
      mockSlackBlocks.textSection.mockReturnValue(text);
      mockSlackModal.slackModal.mockReturnValue(modal);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, profile.country, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockHistoryInterface.searchUserTrackHistory).toHaveBeenCalledWith(teamId, channelId, userId, ['test']);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.no_songs);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.remove_modal, `Remove Tracks`, null, `Close`, [text], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });
  });
});
