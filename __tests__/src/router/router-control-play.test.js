const mockConfig = {
  'slack': {
    'limits': {
      'max_options': 3,
    },
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
const mockAuthorizer = jest.fn();
const mockSlackModal = {
  openModal: jest.fn(),
};
const mockSlackReply = {
  publicAck: jest.fn(),
};
const mockCheckSettings = {
  checkIsSetup: jest.fn(),
};
const mockErrorsSettings = {
  SetupError: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});

jest.mock('/opt/router/authorizer', () => mockAuthorizer, {virtual: true});

jest.mock('/opt/router/slack-modal', () => mockSlackModal, {virtual: true});
jest.mock('/opt/router/slack-reply', () => mockSlackReply, {virtual: true});

jest.mock('/opt/router/check-settings', () => mockCheckSettings, {virtual: true});

jest.mock('/opt/errors/errors-settings', () => mockErrorsSettings, {virtual: true});

const {settings} = require('../../data/request');
const mod = require('../../../src/router/router-control-play');

const event = {
  0: {
    'body': 'token=GR0v8MoxmPNjtsD0rHn9NMIo&team_id=TRVUTD7DM&team_domain=spotbottest&channel_id=CRU3H4MEC&channel_name=general&user_id=URVUTD7UP&user_name=samchungy&command=%2Fdspotbot&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTRVUTD7DM%2F1289154555585%2F3SVdL6AFrxSQazVJhcjZko2M&trigger_id=1276529178274.879979449463.29d062b39a59e254577893dbac2d6556',
    'headers': {
      'Host': '43e8a5c3cf35.ngrok.io',
      'X-Slack-Signature': 'v0=7a59245d5b03eef7ad4a2e245a7cc631d0475373bcb2a7223c0a92ac0e128a2a',
      'X-Slack-Request-Timestamp': '1596324856',
      'X-Forwarded-Proto': 'https',
    },
    'requestContext': {
      'stage': 'local',
    },
  },
};

describe('Router Control Play', () => {
  beforeEach(() => {
    mockSns.publish.mockReturnThis();
  });
  const ack = {public: true};
  const teamId = 'TRVUTD7DM';
  const channelId = 'CRU3H4MEC';
  const userId = 'URVUTD7UP';
  describe('Handler', () => {
    it('should handle be rejected by auth', async () => {
      mockAuthorizer.mockReturnValue(false);
      expect(await mod.handler(event[0])).toStrictEqual({statusCode: 401, body: 'Unauathorized'});
    });
    it('should handle a setup error being thrown', async () => {
      const error = new mockErrorsSettings.SetupError();
      error.message = 'setup error';
      mockAuthorizer.mockReturnValue(error);
      mockCheckSettings.checkIsSetup.mockRejectedValue(error);
      expect(await mod.handler(event[0])).toStrictEqual({statusCode: 200, body: error.message});
    });
    it('should handle an unknown error being thrown', async () => {
      const error = new Error();
      mockAuthorizer.mockReturnValue(error);
      mockCheckSettings.checkIsSetup.mockRejectedValue(error);
      expect(await mod.handler(event[0])).toStrictEqual({statusCode: 200, body: ':warning: An error occured. Please try again.'});
    });
    it('should return a public ack', async () => {
      mockAuthorizer.mockReturnValue(true);
      mockSlackReply.publicAck.mockReturnValue(ack);
      mockCheckSettings.checkIsSetup.mockResolvedValue(settings);
      mockSns.promise.mockResolvedValue();

      expect(await mod.handler(event[0])).toStrictEqual({statusCode: 200, body: JSON.stringify(ack)});
      expect(mockCheckSettings.checkIsSetup).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({
          teamId,
          channelId,
          settings,
          userId,
        }),
        TopicArn: process.env.SNS_PREFIX + 'control-play',
      });
      expect(mockSlackReply.publicAck).toHaveBeenCalledWith('');
    });
  });
});
