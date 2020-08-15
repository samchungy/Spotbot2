const mockConfig = {
  dynamodb: {
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
  slack: {
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
const mockSns = {
  publish: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyPlaylists = {
  fetchPlaylistTotal: jest.fn(),
};
const mockSlackApi = {
  post: jest.fn(),
  postEphemeral: jest.fn(),
};
const mockSlackFormatReply = {
  inChannelPost: jest.fn(),
  ephemeralPost: jest.fn(),
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

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});
jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackBlocks, {virtual: true});

jest.mock('../../../../src/components/control/layers/control-reset', () => mockResetLayer, {virtual: true});

const mod = require('../../../../src/components/control/control-reset-start');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId} = require('../../../data/request');
const params = {
  0: {teamId, channelId, settings, userId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Reset Start', () => {
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
    it('should return a reset review block', async () => {
      const auth = {auth: true};
      const total = {total: 134};
      const reviewTracks = ['a', 'b', 'c'];
      const textSection = {text: true};
      const actionSection = {action: true};
      const buttonAction = {button: true};
      const post = {ephemeral: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockResetLayer.getReviewTracks.mockResolvedValue(reviewTracks);
      mockSlackBlocks.textSection.mockReturnValue(textSection);
      mockSlackBlocks.actionSection.mockReturnValue(actionSection);
      mockSlackBlocks.buttonActionElement.mockReturnValue(buttonAction);
      mockSlackFormatReply.ephemeralPost.mockReturnValue(post);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockResetLayer.getReviewTracks).toHaveBeenCalledWith(auth, settings.playlist, total.total);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.review(reviewTracks.length));
      expect(mockSlackBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.reset_review_confirm, `Review Tracks`, channelId, false, mockConfig.slack.buttons.primary);
      expect(mockSlackBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.reset_review_deny, `Remove Tracks`, channelId, false, mockConfig.slack.buttons.danger);
      expect(mockSlackBlocks.actionSection).toHaveBeenCalledWith(mockConfig.slack.actions.reset_review_confirm, [buttonAction, buttonAction]);
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.review(reviewTracks.length), [textSection, actionSection]);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
    });

    it('should trigger a reset of the playlist', async () => {
      const auth = {auth: true};
      const total = {total: 134};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockResetLayer.getReviewTracks.mockResolvedValue([]);
      mockSns.publish.mockReturnThis();
      mockSns.promise.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockResetLayer.getReviewTracks).toHaveBeenCalledWith(auth, settings.playlist, total.total);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings, trackUris: null, userId}),
        TopicArn: process.env.SNS_PREFIX + 'control-reset-set',
      });
      expect(mockSns.promise).toHaveBeenCalled();
    });

    it('should report that the playlist is empty', async () => {
      const auth = {auth: true};
      const total = {total: 0};
      const post = {inChannel: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.empty, null);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
  });
});
