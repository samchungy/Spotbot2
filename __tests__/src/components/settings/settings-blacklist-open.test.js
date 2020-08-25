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
    'blacklist': {
      'limit': 80,
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
const mockSpotifyStatus = {
  fetchCurrentPlayback: jest.fn(),
  fetchRecent: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSettingsExtra = {
  loadBlacklist: jest.fn(),
  loadSkipWithHistory: jest.fn(),
};
const mockSlackApi = {
  updateModal: jest.fn(),
};
const mockSlackModal = {
  multiSelectStaticGroups: jest.fn(),
  option: jest.fn(),
  optionGroup: jest.fn(),
  slackModal: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockTrack = jest.fn();

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-track', () => mockTrack, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/db/settings-extra-interface', () => mockSettingsExtra, {virtual: true});

jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackModal, {virtual: true});
jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/settings/settings-blacklist-open');
const response = mod.RESPONSE;
const {teamId, channelId, viewId} = require('../../../data/request');
const recent = require('../../../data/spotify/recent');
const status = require('../../../data/spotify/status');
const params = {
  0: {teamId, channelId, viewId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Settings Blacklist Open', () => {
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
    const auth = {auth: true};
    const option = {option: true};
    const optionGroup = {optionGroup: true};
    const multiSelect = {multi: true};
    const modal = {modal: true};

    it('should successfully open the blacklist', async () => {
      const track = {
        id: 'id',
        title: 'title',
      };
      const skip = {history: [track]};
      const blacklist = {blacklist: [track]};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyStatus.fetchRecent.mockResolvedValue(recent[0]);
      mockSettingsExtra.loadSkipWithHistory.mockResolvedValue(skip);
      mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
      mockSlackModal.option.mockReturnValue(option);
      mockTrack.mockReturnValue(track);
      mockSlackModal.optionGroup.mockReturnValue(optionGroup);
      mockSlackModal.multiSelectStaticGroups.mockReturnValue(multiSelect);
      mockSlackModal.slackModal.mockReturnValue(modal);
      mockSlackApi.updateModal.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyStatus.fetchRecent).toHaveBeenCalledWith(auth, mockConfig.spotify_api.recent_limit);
      expect(mockSettingsExtra.loadSkipWithHistory).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackModal.option).toHaveBeenCalledTimes(8);
      recent[0].items.forEach((t) => expect(mockTrack).toHaveBeenCalledWith(t.track));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.skipped, skip.history.map(() => option));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.currently, [option]);
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.recently_played, recent[0].items.map(() => option));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.currently_blacklisted, blacklist.blacklist.map(() => option));
      expect(mockSlackModal.multiSelectStaticGroups).toHaveBeenCalledWith(mockConfig.slack.actions.blacklist_modal, response.label, response.hint, blacklist.blacklist.map(() => option), [optionGroup, optionGroup, optionGroup, optionGroup], true);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.blacklist_modal, `Spotbot Blacklist`, `Save`, `Close`, [multiSelect], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should successfully open a blacklist without status', async () => {
      const track = {
        id: 'id',
        title: 'title',
      };
      const skip = {history: [track]};
      const blacklist = {blacklist: [track]};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue('');
      mockSpotifyStatus.fetchRecent.mockResolvedValue(recent[0]);
      mockSettingsExtra.loadSkipWithHistory.mockResolvedValue(skip);
      mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
      mockSlackModal.option.mockReturnValue(option);
      mockTrack.mockReturnValue(track);
      mockSlackModal.optionGroup.mockReturnValue(optionGroup);
      mockSlackModal.multiSelectStaticGroups.mockReturnValue(multiSelect);
      mockSlackModal.slackModal.mockReturnValue(modal);
      mockSlackApi.updateModal.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyStatus.fetchRecent).toHaveBeenCalledWith(auth, mockConfig.spotify_api.recent_limit);
      expect(mockSettingsExtra.loadSkipWithHistory).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackModal.option).toHaveBeenCalledTimes(7);
      recent[0].items.forEach((t) => expect(mockTrack).toHaveBeenCalledWith(t.track));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.skipped, skip.history.map(() => option));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.recently_played, recent[0].items.map(() => option));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.currently_blacklisted, blacklist.blacklist.map(() => option));
      expect(mockSlackModal.multiSelectStaticGroups).toHaveBeenCalledWith(mockConfig.slack.actions.blacklist_modal, response.label, response.hint, blacklist.blacklist.map(() => option), [optionGroup, optionGroup, optionGroup], true);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.blacklist_modal, `Spotbot Blacklist`, `Save`, `Close`, [multiSelect], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should successfully open a blacklist without skipOptions', async () => {
      const track = {
        id: 'id',
        title: 'title',
      };
      const skip = null;
      const blacklist = {blacklist: [track]};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyStatus.fetchRecent.mockResolvedValue(recent[0]);
      mockSettingsExtra.loadSkipWithHistory.mockResolvedValue(skip);
      mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
      mockSlackModal.option.mockReturnValue(option);
      mockTrack.mockReturnValue(track);
      mockSlackModal.optionGroup.mockReturnValue(optionGroup);
      mockSlackModal.multiSelectStaticGroups.mockReturnValue(multiSelect);
      mockSlackModal.slackModal.mockReturnValue(modal);
      mockSlackApi.updateModal.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyStatus.fetchRecent).toHaveBeenCalledWith(auth, mockConfig.spotify_api.recent_limit);
      expect(mockSettingsExtra.loadSkipWithHistory).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackModal.option).toHaveBeenCalledTimes(7);
      recent[0].items.forEach((t) => expect(mockTrack).toHaveBeenCalledWith(t.track));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.currently, [option]);
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.recently_played, recent[0].items.map(() => option));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.currently_blacklisted, blacklist.blacklist.map(() => option));
      expect(mockSlackModal.multiSelectStaticGroups).toHaveBeenCalledWith(mockConfig.slack.actions.blacklist_modal, response.label, response.hint, blacklist.blacklist.map(() => option), [optionGroup, optionGroup, optionGroup], true);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.blacklist_modal, `Spotbot Blacklist`, `Save`, `Close`, [multiSelect], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should successfully open the blacklist without existing options', async () => {
      const track = {
        id: 'id',
        title: 'title',
      };
      const skip = {history: [track]};
      const blacklist = null;
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyStatus.fetchRecent.mockResolvedValue(recent[0]);
      mockSettingsExtra.loadSkipWithHistory.mockResolvedValue(skip);
      mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
      mockSlackModal.option.mockReturnValue(option);
      mockTrack.mockReturnValue(track);
      mockSlackModal.optionGroup.mockReturnValue(optionGroup);
      mockSlackModal.multiSelectStaticGroups.mockReturnValue(multiSelect);
      mockSlackModal.slackModal.mockReturnValue(modal);
      mockSlackApi.updateModal.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyStatus.fetchRecent).toHaveBeenCalledWith(auth, mockConfig.spotify_api.recent_limit);
      expect(mockSettingsExtra.loadSkipWithHistory).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackModal.option).toHaveBeenCalledTimes(7);
      recent[0].items.forEach((t) => expect(mockTrack).toHaveBeenCalledWith(t.track));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.skipped, skip.history.map(() => option));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.currently, [option]);
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.recently_played, recent[0].items.map(() => option));
      expect(mockSlackModal.multiSelectStaticGroups).toHaveBeenCalledWith(mockConfig.slack.actions.blacklist_modal, response.label, response.hint, null, [optionGroup, optionGroup, optionGroup], true);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.blacklist_modal, `Spotbot Blacklist`, `Save`, `Close`, [multiSelect], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should successfully open the blacklist without recent options', async () => {
      const track = {
        id: 'id',
        title: 'title',
      };
      const skip = {history: [track]};
      const blacklist = {blacklist: [track]};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyStatus.fetchRecent.mockResolvedValue('');
      mockSettingsExtra.loadSkipWithHistory.mockResolvedValue(skip);
      mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
      mockSlackModal.option.mockReturnValue(option);
      mockTrack.mockReturnValue(track);
      mockSlackModal.optionGroup.mockReturnValue(optionGroup);
      mockSlackModal.multiSelectStaticGroups.mockReturnValue(multiSelect);
      mockSlackModal.slackModal.mockReturnValue(modal);
      mockSlackApi.updateModal.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyStatus.fetchRecent).toHaveBeenCalledWith(auth, mockConfig.spotify_api.recent_limit);
      expect(mockSettingsExtra.loadSkipWithHistory).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackModal.option).toHaveBeenCalledTimes(3);
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.skipped, skip.history.map(() => option));
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.currently, [option]);
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(response.currently_blacklisted, blacklist.blacklist.map(() => option));
      expect(mockSlackModal.multiSelectStaticGroups).toHaveBeenCalledWith(mockConfig.slack.actions.blacklist_modal, response.label, response.hint, blacklist.blacklist.map(() => option), [optionGroup, optionGroup, optionGroup], true);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.blacklist_modal, `Spotbot Blacklist`, `Save`, `Close`, [multiSelect], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });
  });
});
