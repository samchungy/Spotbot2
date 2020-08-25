const mockConfig = {
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
const mockSettingsExtra = {
  loadBlacklist: jest.fn(),
  changeBlacklist: jest.fn(),
  changeBlacklistRemove: jest.fn(),
};
const mockSlackApi = {
  postEphemeral: jest.fn(),
};
const mockSlackReply = {
  ephemeralPost: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/db/settings-extra-interface', () => mockSettingsExtra, {virtual: true});

jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackReply, {virtual: true});
jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/settings/settings-blacklist-submit-save');
const response = mod.RESPONSE;
const {teamId, channelId, userId} = require('../../../data/request');
const submissions = {
  0: [
    {
      'text': {
        'type': 'plain_text',
        'text': 'Ed Sheeran - Thinking out Loud',
        'emoji': true,
      },
      'value': '34gCuhDGsG4bRPIf9bb02f',
    },
    {
      'text': {
        'type': 'plain_text',
        'text': 'San Cisco - When I Dream',
        'emoji': true,
      },
      'value': '579j0QRchEajNo11kaaAUx',
    },
  ],
};
const params = {
  0: {teamId, channelId, userId, submissions: submissions[0]},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Settings Blacklist Submit Save', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockSettingsExtra.loadBlacklist.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, userId, response.failed);
    });
  });

  describe('Main', () => {
    const post = {ephemeral: true};

    it('should return successfully when blacklist is empty', async () => {
      const blacklist = null;
      mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
      mockSettingsExtra.changeBlacklist.mockResolvedValue();
      mockSlackReply.ephemeralPost.mockReturnValue(post);
      mockSlackApi.postEphemeral.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsExtra.changeBlacklist).toHaveBeenCalledWith(teamId, channelId, [
        {title: 'Ed Sheeran - Thinking out Loud', id: '34gCuhDGsG4bRPIf9bb02f'},
        {title: 'San Cisco - When I Dream', id: '579j0QRchEajNo11kaaAUx'},
      ] );
      expect(mockSlackReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.success);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
    });

    it('should successfully remove a track and add a track', async () => {
      const blacklist = {
        blacklist: [
          {
            'title': 'San Cisco - When I Dream',
            'uri': 'spotify:track:579j0QRchEajNo11kaaAUx',
            'id': '579j0QRchEajNo11kaaAUx',
          },
          {
            'title': 'Sam Allen - Barricade',
            'uri': 'spotify:track:6jVy9OEtu7VJyPrrHG25jb',
            'id': '6jVy9OEtu7VJyPrrHG25jb',
          },
        ],
      };
      mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
      mockSettingsExtra.changeBlacklist.mockResolvedValue();
      mockSlackReply.ephemeralPost.mockReturnValue(post);
      mockSlackApi.postEphemeral.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsExtra.changeBlacklistRemove).toHaveBeenCalledWith(teamId, channelId, [1]);
      expect(mockSettingsExtra.changeBlacklist).toHaveBeenCalledWith(teamId, channelId, [
        {title: 'Ed Sheeran - Thinking out Loud', id: '34gCuhDGsG4bRPIf9bb02f'},
      ]);
      expect(mockSlackReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.success);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
    });


    it('should successfully save and make no changes', async () => {
      const blacklist = {
        blacklist: [
          {
            'title': 'San Cisco - When I Dream',
            'uri': 'spotify:track:579j0QRchEajNo11kaaAUx',
            'id': '579j0QRchEajNo11kaaAUx',
          },
          {
            'title': 'Ed Sheeran - Thinking out Loud',
            'uri': 'spotify:track:34gCuhDGsG4bRPIf9bb02f',
            'id': '34gCuhDGsG4bRPIf9bb02f',
          },
        ],
      };
      mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
      mockSettingsExtra.changeBlacklist.mockResolvedValue();
      mockSlackReply.ephemeralPost.mockReturnValue(post);
      mockSlackApi.postEphemeral.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.success);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
    });
  });
});
