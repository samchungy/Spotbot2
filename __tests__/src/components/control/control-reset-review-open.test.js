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
  isAfter: jest.fn(),
  isSameOrAfter: jest.fn(),
};
const mockMom = jest.fn(() => mockMoment);
mockMom.tz = mockMoment;
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyPlaylists = {
  fetchPlaylistTotal: jest.fn(),
};
const mockSlackApi = {
  updateModal: jest.fn(),
  reply: jest.fn(),
};
const mockSlackFormatReply = {
  deleteReply: jest.fn(),
};
const mockSlackBlocks = {
  textSection: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockSlackModal = {
  option: jest.fn(),
  optionGroup: jest.fn(),
  multiSelectStaticGroups: jest.fn(),
  slackModal: jest.fn(),
  selectStatic: jest.fn(),
  yesOrNo: jest.fn(),
};
const mockResetLayer = {
  getReviewTracks: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});
jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackBlocks, {virtual: true});
jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackModal, {virtual: true});

jest.mock('../../../../src/components/control/layers/control-reset', () => mockResetLayer, {virtual: true});

const mod = require('../../../../src/components/control/control-reset-review-open');
const response = mod.RESPONSE;
const labels = mod.LABELS;
const {teamId, channelId, settings, viewId, responseUrl} = require('../../../data/request');
const params = {
  0: {teamId, channelId, settings, viewId, responseUrl},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Reset Review Open', () => {
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
    it('should put all tracks into the 10 minute bucket and update modal', async () => {
      const auth = {auth: true};
      const reply = {delete: true};
      const total = {total: 139};
      const playlistTrack = {addedAt: 'time', uri: 'uri', title: 'song'};
      const option = {op: true};
      const optionGroup = {opGroup: true};
      const ten = '10 minutes';
      const twenty = '20 minutes';
      const modal = {modal: true};
      const text = {section: true};
      const multiGroups = {group: true};
      const select = {static: true};
      const yes = {yes: true};

      mockSlackFormatReply.deleteReply.mockReturnValue(reply);
      mockSlackApi.reply.mockResolvedValue();
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockResetLayer.getReviewTracks.mockResolvedValue([playlistTrack, playlistTrack, playlistTrack]);
      mockSlackModal.option.mockReturnValue(option);
      mockMoment.subtract
          .mockReturnValueOnce(ten)
          .mockReturnValueOnce(twenty);
      mockMoment.isSameOrAfter.mockReturnValue(true);
      mockSlackModal.optionGroup.mockReturnValue(optionGroup);
      mockSlackModal.slackModal.mockReturnValue(modal);
      mockSlackBlocks.textSection.mockReturnValue(text);
      mockSlackModal.selectStatic.mockReturnValue(select);
      mockSlackModal.multiSelectStaticGroups.mockReturnValue(multiGroups);
      mockSlackModal.yesOrNo.mockReturnValue(yes);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
      expect(mockSlackApi.reply).toHaveBeenCalledWith(reply, responseUrl);
      expect(mockResetLayer.getReviewTracks).toHaveBeenCalledWith(auth, settings.playlist, total.total);
      expect(mockMoment.subtract).toHaveBeenCalledWith(10, 'minutes');
      expect(mockMoment.subtract).toHaveBeenCalledWith(20, 'minutes');
      expect(mockMom).toHaveBeenCalledWith(playlistTrack.addedAt);
      expect(mockSlackModal.option).toHaveBeenCalledWith(playlistTrack.title, playlistTrack.uri);
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(labels.ten, [option, option, option]);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.review_title(3));
      expect(mockSlackModal.multiSelectStaticGroups).toHaveBeenCalledWith(mockConfig.slack.actions.reset_modal, labels.select, labels.preselect, [option, option, option], [optionGroup], true);
      expect(mockSlackModal.selectStatic).toHaveBeenCalledWith(mockConfig.slack.actions.reset_review_jump, labels.jump, labels.jump_desc, option, yes);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.reset_modal, `Reset: Review Tracks`, `Confirm`, `Close`, [text, multiGroups, select], true, channelId);
    });

    it('should put a single track into the 10 minute bucket and update modal', async () => {
      const auth = {auth: true};
      const reply = {delete: true};
      const total = {total: 139};
      const playlistTrack = {addedAt: 'time', uri: 'uri', title: 'song'};
      const option = {op: true};
      const optionGroup = {opGroup: true};
      const ten = '10 minutes';
      const twenty = '20 minutes';
      const modal = {modal: true};
      const text = {section: true};
      const multiGroups = {group: true};
      const select = {static: true};
      const yes = {yes: true};

      mockSlackFormatReply.deleteReply.mockReturnValue(reply);
      mockSlackApi.reply.mockResolvedValue();
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockResetLayer.getReviewTracks.mockResolvedValue([playlistTrack]);
      mockSlackModal.option.mockReturnValue(option);
      mockMoment.subtract
          .mockReturnValueOnce(ten)
          .mockReturnValueOnce(twenty);
      mockMoment.isSameOrAfter.mockReturnValue(true);
      mockSlackModal.optionGroup.mockReturnValue(optionGroup);
      mockSlackModal.slackModal.mockReturnValue(modal);
      mockSlackBlocks.textSection.mockReturnValue(text);
      mockSlackModal.selectStatic.mockReturnValue(select);
      mockSlackModal.multiSelectStaticGroups.mockReturnValue(multiGroups);
      mockSlackModal.yesOrNo.mockReturnValue(yes);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
      expect(mockSlackApi.reply).toHaveBeenCalledWith(reply, responseUrl);
      expect(mockResetLayer.getReviewTracks).toHaveBeenCalledWith(auth, settings.playlist, total.total);
      expect(mockMoment.subtract).toHaveBeenCalledWith(10, 'minutes');
      expect(mockMoment.subtract).toHaveBeenCalledWith(20, 'minutes');
      expect(mockMom).toHaveBeenCalledWith(playlistTrack.addedAt);
      expect(mockSlackModal.option).toHaveBeenCalledWith(playlistTrack.title, playlistTrack.uri);
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(labels.ten, [option]);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.review_title(1));
      expect(mockSlackModal.multiSelectStaticGroups).toHaveBeenCalledWith(mockConfig.slack.actions.reset_modal, labels.select, labels.preselect, [option], [optionGroup], true);
      expect(mockSlackModal.selectStatic).toHaveBeenCalledWith(mockConfig.slack.actions.reset_review_jump, labels.jump, labels.jump_desc, option, yes);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.reset_modal, `Reset: Review Tracks`, `Confirm`, `Close`, [text, multiGroups, select], true, channelId);
    });

    it('should put all tracks into the 20 minute bucket and 30 minute buckets and update modal', async () => {
      const auth = {auth: true};
      const reply = {delete: true};
      const total = {total: 139};
      const playlistTrack = {addedAt: 'time', uri: 'uri', title: 'song'};
      const option = {op: true};
      const optionGroup = {opGroup: true};
      const ten = '10 minutes';
      const twenty = '20 minutes';
      const modal = {modal: true};
      const text = {section: true};
      const multiGroups = {group: true};
      const select = {static: true};
      const yes = {yes: true};

      mockSlackFormatReply.deleteReply.mockReturnValue(reply);
      mockSlackApi.reply.mockResolvedValue();
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockResetLayer.getReviewTracks.mockResolvedValue([playlistTrack, playlistTrack, playlistTrack]);
      mockSlackModal.option.mockReturnValue(option);
      mockMoment.subtract
          .mockReturnValueOnce(ten)
          .mockReturnValueOnce(twenty);
      mockMoment.isSameOrAfter
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(false);

      mockSlackModal.optionGroup.mockReturnValue(optionGroup);
      mockSlackModal.slackModal.mockReturnValue(modal);
      mockSlackBlocks.textSection.mockReturnValue(text);
      mockSlackModal.selectStatic.mockReturnValue(select);
      mockSlackModal.multiSelectStaticGroups.mockReturnValue(multiGroups);
      mockSlackModal.yesOrNo.mockReturnValue(yes);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackFormatReply.deleteReply).toHaveBeenCalledWith('', null);
      expect(mockSlackApi.reply).toHaveBeenCalledWith(reply, responseUrl);
      expect(mockResetLayer.getReviewTracks).toHaveBeenCalledWith(auth, settings.playlist, total.total);
      expect(mockMoment.subtract).toHaveBeenCalledWith(10, 'minutes');
      expect(mockMoment.subtract).toHaveBeenCalledWith(20, 'minutes');
      expect(mockMom).toHaveBeenCalledWith(playlistTrack.addedAt);
      expect(mockMoment.isSameOrAfter).toHaveBeenCalledTimes(6);
      expect(mockSlackModal.option).toHaveBeenCalledWith(playlistTrack.title, playlistTrack.uri);
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(labels.twenty, [option, option]);
      expect(mockSlackModal.optionGroup).toHaveBeenCalledWith(labels.thirty, [option]);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.review_title(3));
      expect(mockSlackModal.multiSelectStaticGroups).toHaveBeenCalledWith(mockConfig.slack.actions.reset_modal, labels.select, labels.preselect, null, [optionGroup, optionGroup], true);
      expect(mockSlackModal.selectStatic).toHaveBeenCalledWith(mockConfig.slack.actions.reset_review_jump, labels.jump, labels.jump_desc, option, yes);
      expect(mockSlackModal.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.reset_modal, `Reset: Review Tracks`, `Confirm`, `Close`, [text, multiGroups, select], true, channelId);
    });
  });
});
