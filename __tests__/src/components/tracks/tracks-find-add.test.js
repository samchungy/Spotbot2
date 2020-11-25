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
      'create_new_playlist': 'CNP.',
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
    'tracks': {
      'limit': 24,
      'info_limit': 50,
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
const mockMoment = {
  tz: jest.fn(),
  format: jest.fn(),
  names: jest.fn(),
  unix: jest.fn(),
  fromNow: jest.fn(),
  add: jest.fn(),
  isAfter: jest.fn(),
  subtract: jest.fn(),
};
const mockMom = jest.fn(() => mockMoment);
mockMom.unix = jest.fn(() => mockMoment);
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
  play: jest.fn(),
};
const mockSpotifyStatus = {
  fetchCurrentPlayback: jest.fn(),
};
const mockSpotifyHelper = {
  onPlaylist: jest.fn(),
  isPlaying: jest.fn(),
};
const mockSpotifyPlaylists = {
  addTracksToPlaylist: jest.fn(),
  deleteTracks: jest.fn(),
};
const mockTrack = jest.fn();
const mockSlackApi = {
  post: jest.fn(),
  reply: jest.fn(),
  postEphemeral: jest.fn(),
};
const mockSlackFormatReply = {
  inChannelPost: jest.fn(),
  deleteReply: jest.fn(),
  ephemeralPost: jest.fn(),
};
const mockSlackFormatBlocks = {
  actionSection: jest.fn(),
  buttonActionElement: jest.fn(),
  textSection: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockSettingsExtra = {
  changeBackToPlaylistState: jest.fn(),
  loadBlacklist: jest.fn(),
};
const mockHistoryInterface = {
  changeTrackHistory: jest.fn(),
  loadTrackHistory: jest.fn(),
};
const mockUtilTimeout = {
  sleep: jest.fn(),
};
const mockFind = {
  findTrackIndex: jest.fn(),
};
const mockUnplayable = {
  removeUnplayable: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-devices', () => mockSpotifyDevices, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback', () => mockSpotifyPlayback, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});

jest.mock('/opt/spotify/spotify-helper', () => mockSpotifyHelper, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-track', () => mockTrack, {virtual: true});

jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackFormatBlocks, {virtual: true});
jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

jest.mock('/opt/db/settings-extra-interface', () => mockSettingsExtra, {virtual: true});
jest.mock('/opt/db/history-interface', () => mockHistoryInterface, {virtual: true});
jest.mock('/opt/utils/util-timeout', () => mockUtilTimeout, {virtual: true});

jest.mock('../../../../src/components/tracks/layers/find-index', () => mockFind, {virtual: true});
jest.mock('../../../../src/components/tracks/layers/remove-unplayable', () => mockUnplayable, {virtual: true});

const mod = require('../../../../src/components/tracks/tracks-find-add');
const response = mod.RESPONSE;
const status = require('../../../data/spotify/status');
const {teamId, channelId, userId, settings, settings2, responseUrl} = require('../../../data/request');
const params = {
  0: {teamId, channelId, userId, settings, responseUrl, trackValue: `{"title":"song title","uri":"track uri","id":"some track id"}`},
  1: {teamId, channelId, userId, settings: settings2, responseUrl, trackValue: `{"title":"song title","uri":"track uri","id":"some track id"}`},
  2: {teamId, channelId, userId, settings, responseUrl, trackValue: `{"title":"song title","uri":"track uri","id":"blacklisted track"}`},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Tracks Current', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockAuthSession.authSession.mockRejectedValue(error);
      mockSlackApi.reply.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, userId, response.failed);
    });
  });

  describe('Main', () => {
    beforeEach(() => {
      mockMom.mockImplementation(() => mockMoment);
      mockMom.unix.mockImplementation(() => mockMoment);
    });
    const post = {inChannel: true};
    const profile = {country: 'AU'};
    const auth = {auth: true, getProfile: () => profile};
    const deleteReply = {delete: true};
    const blacklist = {blacklist: [{id: 'blacklisted track'}]};
    const noMatch = {uri: 'non matching uri', id: status[0].item.id, title: 'the song'};
    const match = {title: 'song title', uri: 'track uri', id: 'some track id'};
    const history = {
      'timeAdded': 1598142986,
      'artistsIds': [
        '6yrtCy4XJHXM6tczo4RlTs',
      ],
      'team_channel': 'TRVUTD7DM-CRU3H4MEC',
      'id': '2BrsEZqObLdNQEh6degzqS',
      'numAdds': 7,
      'ttl': 1600821386,
      'userId': 'URVUTD7UP',
    };
    const unix = '12345678';
    const buttonAction = {buttonActionElement: true};
    const textSection = {textSection: true};
    const actionSection = {actionSection: true};
    const ephemeral = {ephemeral: true};
    describe('General', () => {
      beforeEach(() => {
        mockSlackApi.reply.mockResolvedValue();
      });
      it('should fail to reply and have it logged', async () => {
        const error = new Error();
        mockSlackApi.reply.mockRejectedValue(error);
        await expect(mod.handler(event(params[0]))).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(error);
      });

      it('should detect that the track is on the blacklist and fail', async () => {
        mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
        mockSlackFormatReply.inChannelPost.mockReturnValue(post);
        await expect(mod.handler(event(params[2]))).resolves.toBe();
        expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.blacklist('song title'), null);
        expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      });

      it('should detect that track has been added too recently', async () => {
        const from = '3 minutes ago';
        mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
        mockSlackFormatReply.inChannelPost.mockReturnValue(post);
        mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
        mockMoment.unix.mockReturnThis();
        mockMoment.add.mockReturnThis();
        mockMoment.isAfter.mockReturnValue(true);
        mockMoment.fromNow.mockReturnValue(from);
        await expect(mod.handler(event(params[0]))).resolves.toBe();
        expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.repeat('song title', from, settings.disable_repeats_duration), null);
        expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      });
    });
    describe('Back to Playlist - Off', () => {
      beforeEach(() => {
        mockSlackApi.reply.mockResolvedValue();
      });
      describe('On Playlist', () => {
        it('should successfully add a track to the playlist', async () => {
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
          mockSpotifyHelper.isPlaying.mockReturnValue(true);

          await expect(mod.handler(event(params[0]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockMoment.add).toHaveBeenCalledWith('1', 'month');
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockHistoryInterface.changeTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id', userId, unix, unix);
          expect(mockSpotifyPlaylists.addTracksToPlaylist).toHaveBeenCalledWith(auth, settings.playlist.id, ['track uri']);
          expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success('song title'));
          expect(mockSlackApi.post).toHaveBeenCalledWith(post);
          expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
          expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
        });

        it('should successfully add a track to the playlist and send resume question', async () => {
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
          mockSpotifyHelper.isPlaying.mockReturnValue(false);
          mockSlackFormatBlocks.buttonActionElement.mockReturnValue(buttonAction);
          mockSlackFormatBlocks.textSection.mockReturnValue(textSection);
          mockSlackFormatBlocks.actionSection.mockReturnValue(actionSection);
          mockSlackFormatReply.ephemeralPost.mockReturnValue(ephemeral);

          await expect(mod.handler(event(params[0]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockMoment.add).toHaveBeenCalledWith('1', 'month');
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockHistoryInterface.changeTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id', userId, unix, unix);
          expect(mockSpotifyPlaylists.addTracksToPlaylist).toHaveBeenCalledWith(auth, settings.playlist.id, ['track uri']);
          expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success('song title'));
          expect(mockSlackApi.post).toHaveBeenCalledWith(post);
          expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
          expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
          expect(mockSlackFormatBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.controls.play_close, mod.BUTTON.resume, mockConfig.slack.actions.controls.play_close);
          expect(mockSlackFormatBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.controls.play_track, mod.BUTTON.track, 'track uri');
          expect(mockSlackFormatBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.controls.jump_to_start_close, mod.BUTTON.jump, mockConfig.slack.actions.controls.jump_to_start_close);
          expect(mockSlackFormatBlocks.textSection).toHaveBeenCalledWith(response.resume('song title'));
          expect(mockSlackFormatBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction, buttonAction, buttonAction]);
          expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.resume('song title'), [textSection, actionSection]);
          expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(ephemeral);
        });

        it('should successfully add a track to the playlist and not send resume question because of unknown track', async () => {
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[4]);
          mockSpotifyHelper.isPlaying.mockReturnValue(false);
          mockSlackFormatBlocks.buttonActionElement.mockReturnValue(buttonAction);
          mockSlackFormatBlocks.textSection.mockReturnValue(textSection);
          mockSlackFormatBlocks.actionSection.mockReturnValue(actionSection);
          mockSlackFormatReply.ephemeralPost.mockReturnValue(ephemeral);

          await expect(mod.handler(event(params[0]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockMoment.add).toHaveBeenCalledWith('1', 'month');
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockHistoryInterface.changeTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id', userId, unix, unix);
          expect(mockSpotifyPlaylists.addTracksToPlaylist).toHaveBeenCalledWith(auth, settings.playlist.id, ['track uri']);
          expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success('song title'));
          expect(mockSlackApi.post).toHaveBeenCalledWith(post);
          expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
        });
      });
      describe('Off Playlist', () => {
        it('should successfully add a track to the playlist and send back to playlist question', async () => {
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
          mockSpotifyHelper.isPlaying.mockReturnValue(true);
          mockSlackFormatBlocks.buttonActionElement.mockReturnValue(buttonAction);
          mockSlackFormatBlocks.textSection.mockReturnValue(textSection);
          mockSlackFormatBlocks.actionSection.mockReturnValue(actionSection);
          mockSlackFormatReply.ephemeralPost.mockReturnValue(ephemeral);

          await expect(mod.handler(event(params[0]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockMoment.add).toHaveBeenCalledWith('1', 'month');
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockHistoryInterface.changeTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id', userId, unix, unix);
          expect(mockSpotifyPlaylists.addTracksToPlaylist).toHaveBeenCalledWith(auth, settings.playlist.id, ['track uri']);
          expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success('song title'));
          expect(mockSlackApi.post).toHaveBeenCalledWith(post);
          expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
          expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
          expect(mockSlackFormatBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.controls.play_track, mod.BUTTON.track, 'track uri');
          expect(mockSlackFormatBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.controls.jump_to_start_close, mod.BUTTON.jump, mockConfig.slack.actions.controls.jump_to_start_close);
          expect(mockSlackFormatBlocks.textSection).toHaveBeenCalledWith(response.back('song title'));
          expect(mockSlackFormatBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction, buttonAction]);
          expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.back('song title'), [textSection, actionSection]);
          expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(ephemeral);
        });
      });
    });
    describe('Back to Playlist - On', () => {
      beforeEach(() => {
        mockSlackApi.reply.mockResolvedValue();
      });
      describe('On Playlist', () => {
        it('should successfully add track normally when status is onPlaylist', async () => {
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
          mockSpotifyHelper.isPlaying.mockReturnValue(true);
          mockSpotifyHelper.onPlaylist.mockReturnValue(true);

          await expect(mod.handler(event(params[1]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockMoment.add).toHaveBeenCalledWith('1', 'month');
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockHistoryInterface.changeTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id', userId, unix, unix);
          expect(mockSpotifyPlaylists.addTracksToPlaylist).toHaveBeenCalledWith(auth, settings.playlist.id, ['track uri']);
          expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success('song title'));
          expect(mockSlackApi.post).toHaveBeenCalledWith(post);
          expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
          expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
          expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
        });

        it('should successfully add track normally when status is not playing', async () => {
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
          mockSpotifyHelper.isPlaying.mockReturnValue(false);

          await expect(mod.handler(event(params[1]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockMoment.add).toHaveBeenCalledWith('1', 'month');
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockHistoryInterface.changeTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id', userId, unix, unix);
          expect(mockSpotifyPlaylists.addTracksToPlaylist).toHaveBeenCalledWith(auth, settings.playlist.id, ['track uri']);
          expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success('song title'));
          expect(mockSlackApi.post).toHaveBeenCalledWith(post);
          expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
          expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
        });
      });

      describe('Off Playlist', () => {
        it('should go back to playlist with status track, add our track, remove the status track from playlist', async () => {
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
          mockSpotifyHelper.isPlaying.mockReturnValue(true);
          mockSpotifyHelper.onPlaylist.mockReturnValue(false);
          mockTrack.mockReturnValue(noMatch);
          mockSettingsExtra.changeBackToPlaylistState.mockResolvedValue();
          mockMoment.subtract.mockReturnThis();
          mockFind.findTrackIndex.mockResolvedValue(1);

          await expect(mod.handler(event(params[1]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockTrack).toHaveBeenCalledWith(status[0].item);
          expect(mockMoment.subtract).toHaveBeenCalledWith('2', 's');
          expect(mockSettingsExtra.changeBackToPlaylistState).toHaveBeenCalledWith(teamId, channelId, unix, unix);
          expect(mockMoment.add).toHaveBeenCalledWith('1', 'month');
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockHistoryInterface.changeTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id', userId, unix, unix);
          expect(mockSpotifyPlaylists.addTracksToPlaylist).toHaveBeenCalledWith(auth, settings.playlist.id, ['non matching uri', 'track uri']);
          expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[0].device.id, settings.playlist.uri, {position: 1}, status[0].progress_ms);
          expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, [{
            uri: noMatch.uri,
            positions: [1],
          }]);
        });

        it('should go back to playlist with status track, add our track and not remove any', async () => {
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
          mockSpotifyHelper.isPlaying.mockReturnValue(true);
          mockSpotifyHelper.onPlaylist.mockReturnValue(false);
          mockTrack.mockReturnValue(match);
          mockSettingsExtra.changeBackToPlaylistState.mockResolvedValue();
          mockMoment.subtract.mockReturnThis();
          mockFind.findTrackIndex.mockResolvedValue(2);

          await expect(mod.handler(event(params[1]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockTrack).toHaveBeenCalledWith(status[0].item);
          expect(mockMoment.subtract).toHaveBeenCalledWith('2', 's');
          expect(mockSettingsExtra.changeBackToPlaylistState).toHaveBeenCalledWith(teamId, channelId, unix, unix);
          expect(mockMoment.add).toHaveBeenCalledWith('1', 'month');
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockHistoryInterface.changeTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id', userId, unix, unix);
          expect(mockSpotifyPlaylists.addTracksToPlaylist).toHaveBeenCalledWith(auth, settings.playlist.id, ['track uri']);
          expect(mockSpotifyPlayback.play).toHaveBeenCalledWith(auth, status[0].device.id, settings.playlist.uri, {position: 2});
        });

        it('should try to go back to playlist, run into ConditionalCheckFailedException and then add a track regularly', async () => {
          const error = new Error();
          error.code = 'ConditionalCheckFailedException';
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
          mockSpotifyHelper.isPlaying.mockReturnValue(true);
          mockSpotifyHelper.onPlaylist.mockReturnValue(false);
          mockMoment.subtract.mockReturnThis();
          mockSettingsExtra.changeBackToPlaylistState.mockRejectedValue(error);

          await expect(mod.handler(event(params[1]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockMoment.add).toHaveBeenCalledWith('1', 'month');
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockTrack).toHaveBeenCalledWith(status[0].item);
          expect(mockMoment.subtract).toHaveBeenCalledWith('2', 's');
          expect(mockSettingsExtra.changeBackToPlaylistState).toHaveBeenCalledWith(teamId, channelId, unix, unix);
          expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(2000);
          expect(mockHistoryInterface.changeTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id', userId, unix, unix);
          expect(mockSpotifyPlaylists.addTracksToPlaylist).toHaveBeenCalledWith(auth, settings.playlist.id, ['track uri']);
          expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.success('song title'));
          expect(mockSlackApi.post).toHaveBeenCalledWith(post);
          expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
          expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
        });

        it('should try to go back to playlist, run into an unknown error and then throw it', async () => {
          const error = new Error();
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
          mockSpotifyHelper.isPlaying.mockReturnValue(true);
          mockSpotifyHelper.onPlaylist.mockReturnValue(false);
          mockMoment.subtract.mockReturnThis();
          mockSettingsExtra.changeBackToPlaylistState.mockRejectedValue(error);

          await expect(mod.handler(event(params[1]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockTrack).toHaveBeenCalledWith(status[0].item);
          expect(mockMoment.subtract).toHaveBeenCalledWith('2', 's');
          expect(mockSettingsExtra.changeBackToPlaylistState).toHaveBeenCalledWith(teamId, channelId, unix, unix);
          expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
          expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
          expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        });

        it('should fail due to playlist being empty after add', async () => {
          const error = new Error();
          mockSlackFormatReply.deleteReply.mockReturnValue(deleteReply);
          mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
          mockAuthSession.authSession.mockResolvedValue(auth);
          mockHistoryInterface.loadTrackHistory.mockResolvedValue(history);
          mockMoment.add.mockReturnThis();
          mockMoment.isAfter.mockReturnValue(false);
          mockMoment.unix.mockReturnValue(unix);
          mockSlackFormatReply.inChannelPost.mockReturnValue(post);
          mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
          mockSpotifyHelper.isPlaying.mockReturnValue(true);
          mockSpotifyHelper.onPlaylist.mockReturnValue(false);
          mockTrack.mockReturnValue(noMatch);
          mockSettingsExtra.changeBackToPlaylistState.mockResolvedValue();
          mockMoment.subtract.mockReturnThis();
          mockFind.findTrackIndex.mockRejectedValue(error);

          await expect(mod.handler(event(params[1]))).resolves.toBe();
          expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
          expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
          expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
          expect(mockHistoryInterface.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id');
          expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
          expect(mockMoment.add).toHaveBeenCalledWith(settings.disable_repeats_duration, 'hours');
          expect(mockMoment.isAfter).toHaveBeenCalledWith(mockMoment);
          expect(mockTrack).toHaveBeenCalledWith(status[0].item);
          expect(mockMoment.subtract).toHaveBeenCalledWith('2', 's');
          expect(mockSettingsExtra.changeBackToPlaylistState).toHaveBeenCalledWith(teamId, channelId, unix, unix);
          expect(mockMoment.add).toHaveBeenCalledWith('1', 'month');
          expect(mockMoment.unix).toHaveBeenCalledWith();
          expect(mockHistoryInterface.changeTrackHistory).toHaveBeenCalledWith(teamId, channelId, 'some track id', userId, unix, unix);
          expect(mockSpotifyPlaylists.addTracksToPlaylist).toHaveBeenCalledWith(auth, settings.playlist.id, ['non matching uri', 'track uri']);
          expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), response.failed);
        });
      });
    });
  });
});
