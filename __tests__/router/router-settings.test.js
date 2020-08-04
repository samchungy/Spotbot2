/* eslint-disable require-jsdoc */
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
const mockCheckSettings = {
  checkIsAdmin: jest.fn(),
  checkIsInChannel: jest.fn(),
  checkIsSetup: jest.fn(),
  checkIsPreviouslySetup: jest.fn(),
};
const {SetupError, SettingsError, ChannelAdminError} = require('../../src/layers/layers-core/errors/errors-settings');
const mockErrorsSettings = {
  SettingsError: SettingsError,
  SetupError: SetupError,
};

jest.doMock('/opt/config/config', () => mockConfig, {virtual: true});
jest.doMock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.doMock('/opt/sns', () => mockSns, {virtual: true});

jest.doMock('/opt/router/authorizer', () => mockAuthorizer, {virtual: true});

jest.doMock('/opt/router/slack-modal', () => mockSlackModal, {virtual: true});

jest.doMock('/opt/router/check-settings', () => mockCheckSettings, {virtual: true});
jest.doMock('/opt/errors/errors-settings', () => mockErrorsSettings, {virtual: true});

const {settings} = require('../data/request');
const querystring = require('querystring');
const mod = require('../../src/router/router-settings');
const modal = require('../data/slack/open-modal');
const router = mod.__get__('router');
const response = mod.__get__('RESPONSE');
const settingsOpen = mod.__get__('SETTINGS_OPEN');
const settingsBlacklistOpen = mod.__get__('SETTINGS_BLACKLIST_OPEN');
const settingsDeviceSelect = mod.__get__('SETTINGS_DEVICE_SELECT');
// const settingsSonosOpen = mod.__get__('SETTINGS_SONOS_OPEN');

const event = {
  0: {
    'body': 'token=GR0v8MoxmPNjtsD0rHn9NMIo&team_id=TRVUTD7DM&team_domain=spotbottest&channel_id=CRU3H4MEC&channel_name=general&user_id=URVUTD7UP&user_name=samchungy&command=%2Fdspotbot&text=help&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTRVUTD7DM%2F1289154555585%2F3SVdL6AFrxSQazVJhcjZko2M&trigger_id=1276529178274.879979449463.29d062b39a59e254577893dbac2d6556',
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
  1: {
    'body': 'token=GR0v8MoxmPNjtsD0rHn9NMIo&team_id=TRVUTD7DM&team_domain=spotbottest&channel_id=CRU3H4MEC&channel_name=general&user_id=URVUTD7UP&user_name=samchungy&command=%2Fdspotbot&text=&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTRVUTD7DM%2F1289154555585%2F3SVdL6AFrxSQazVJhcjZko2M&trigger_id=1276529178274.879979449463.29d062b39a59e254577893dbac2d6556',
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
  2: {
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
  3: {
    'body': 'token=GR0v8MoxmPNjtsD0rHn9NMIo&team_id=TRVUTD7DM&team_domain=spotbottest&channel_id=CRU3H4MEC&channel_name=general&user_id=URVUTD7UP&user_name=samchungy&command=%2Fdspotbot&text=settings&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTRVUTD7DM%2F1289154555585%2F3SVdL6AFrxSQazVJhcjZko2M&trigger_id=1276529178274.879979449463.29d062b39a59e254577893dbac2d6556',
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
  4: {
    'body': 'token=GR0v8MoxmPNjtsD0rHn9NMIo&team_id=TRVUTD7DM&team_domain=spotbottest&channel_id=CRU3H4MEC&channel_name=general&user_id=URVUTD7UP&user_name=samchungy&command=%2Fdspotbot&text=blacklist&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTRVUTD7DM%2F1289154555585%2F3SVdL6AFrxSQazVJhcjZko2M&trigger_id=1276529178274.879979449463.29d062b39a59e254577893dbac2d6556',
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
  5: {
    'body': 'token=GR0v8MoxmPNjtsD0rHn9NMIo&team_id=TRVUTD7DM&team_domain=spotbottest&channel_id=CRU3H4MEC&channel_name=general&user_id=URVUTD7UP&user_name=samchungy&command=%2Fdspotbot&text=device&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTRVUTD7DM%2F1289154555585%2F3SVdL6AFrxSQazVJhcjZko2M&trigger_id=1276529178274.879979449463.29d062b39a59e254577893dbac2d6556',
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
  6: {
    'body': 'token=GR0v8MoxmPNjtsD0rHn9NMIo&team_id=TRVUTD7DM&team_domain=spotbottest&channel_id=CRU3H4MEC&channel_name=general&user_id=URVUTD7UP&user_name=samchungy&command=%2Fdspotbot&text=garbage&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTRVUTD7DM%2F1289154555585%2F3SVdL6AFrxSQazVJhcjZko2M&trigger_id=1276529178274.879979449463.29d062b39a59e254577893dbac2d6556',
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

describe('Router Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handler', () => {
    afterAll(() => {
      mod.__ResetDependency__('main');
    });
    describe('success', () => {
      it('should call the router function and return a 200 with no data', async () => {
        mod.__set__('router', () => Promise.resolve());
        mockAuthorizer.mockReturnValue(true);

        expect.assertions(2);
        await expect(mod.handler(event[0])).resolves.toStrictEqual({statusCode: 200, body: ''});
        expect(mockAuthorizer).toBeCalledWith(event[0]);
      });

      it('should call the router function and return a 200 with data', async () => {
        const data = {data: true};
        mod.__set__('router', () => Promise.resolve(data));
        mockAuthorizer.mockReturnValue(true);

        expect.assertions(2);
        await expect(mod.handler(event[0])).resolves.toStrictEqual({statusCode: 200, body: data});
        expect(mockAuthorizer).toBeCalledWith(event[0]);
      });
    });
    describe('auth', () => {
      it('should return an auth error', async () => {
        mockAuthorizer.mockReturnValue(false);

        expect.assertions(2);
        await expect(mod.handler(event[0])).resolves.toStrictEqual({statusCode: 401, body: response.unauthorized});
        expect(mockAuthorizer).toBeCalledWith(event[0]);
      });
    });
    describe('error', () => {
      it('should report a setup error to Slack', async () => {
        const error = new mockErrorsSettings.SetupError();
        error.message = 'A setup error';

        mod.__set__('router', () => Promise.reject(error));
        mockAuthorizer.mockReturnValue(true);

        expect.assertions(1);
        await expect(mod.handler(event[0])).resolves.toStrictEqual({statusCode: 200, body: error.message});
      });

      it('should report a generic error to Slack', async () => {
        const error = new Error();

        mod.__set__('router', () => Promise.reject(error));
        mockAuthorizer.mockReturnValue(true);

        expect.assertions(2);
        await expect(mod.handler(event[0])).resolves.toStrictEqual({statusCode: 200, body: response.error});
        expect(mockLogger.error).toBeCalledWith(error, response.failed);
      });
    });
  });

  describe('router', () => {
    it('should respond to help', async () => {
      await expect(router(event[0])).resolves.toBe(response.help);
    });
    it('should respond to no text and respond with help', async () => {
      await expect(router(event[1])).resolves.toBe(response.help);
    });
    it('should respond to no payload text at all and respond with help', async () => {
      await expect(router(event[2])).resolves.toBe(response.help);
    });
    it('should respond to garbage payload text at all and respond with invalid', async () => {
      await expect(router(event[6])).resolves.toBe(response.invalid);
    });

    describe('settings', () => {
      it('should open an empty modal and trigger OpenSettings - not setup', async () => {
        const {team_id: teamId, channel_id: channelId, trigger_id: triggerId, user_id: userId} = querystring.parse(event[3].body);
        const setupError = new mockErrorsSettings.SetupError();
        const settingsError = new mockErrorsSettings.SettingsError();
        const params = {
          Message: JSON.stringify({
            teamId,
            channelId,
            settings: null,
            viewId: modal[0].view.id,
            userId,
            url: 'https://43e8a5c3cf35.ngrok.io/local',
          }),
          TopicArn: settingsOpen,
        };

        mockCheckSettings.checkIsPreviouslySetup.mockRejectedValue(setupError);
        mockCheckSettings.checkIsInChannel.mockResolvedValue(true);
        mockCheckSettings.checkIsSetup.mockRejectedValue(settingsError);
        mockSlackModal.openModal.mockResolvedValue(modal[0]);
        mockSns.promise.mockResolvedValue();

        await expect(router(event[3])).resolves.toBe();
        expect(mockCheckSettings.checkIsPreviouslySetup).toBeCalledWith(teamId, channelId);
        expect(mockCheckSettings.checkIsInChannel).toBeCalledWith(channelId);
        expect(mockCheckSettings.checkIsSetup).toBeCalledWith(teamId, channelId, null);
        expect(mockSlackModal.openModal).toBeCalledWith(teamId, channelId, triggerId, mockConfig.slack.actions.empty_modal, 'Spotbot Settings', null, 'Cancel');
        expect(mockSns.publish).toBeCalledWith(params);
      });

      it('should open an empty modal and trigger OpenSettings - already setup & authenticated', async () => {
        const {team_id: teamId, channel_id: channelId, trigger_id: triggerId, user_id: userId} = querystring.parse(event[3].body);
        const params = {
          Message: JSON.stringify({
            teamId,
            channelId,
            settings,
            viewId: modal[0].view.id,
            userId,
            url: 'https://43e8a5c3cf35.ngrok.io/local',
          }),
          TopicArn: settingsOpen,
        };

        mockCheckSettings.checkIsPreviouslySetup.mockResolvedValue(settings);
        mockCheckSettings.checkIsSetup.mockResolvedValue();
        mockCheckSettings.checkIsAdmin.mockResolvedValue(true);
        mockSlackModal.openModal.mockResolvedValue(modal[0]);
        mockSns.promise.mockResolvedValue();

        await expect(router(event[3])).resolves.toBe();
        expect(mockCheckSettings.checkIsPreviouslySetup).toBeCalledWith(teamId, channelId);
        expect(mockCheckSettings.checkIsSetup).toBeCalledWith(teamId, channelId, settings);
        expect(mockCheckSettings.checkIsAdmin).toBeCalledWith(settings, userId);
        expect(mockSlackModal.openModal).toBeCalledWith(teamId, channelId, triggerId, mockConfig.slack.actions.empty_modal, 'Spotbot Settings', null, 'Cancel');
        expect(mockSns.publish).toBeCalledWith(params);
      });

      it('should deny opening settings - already setup & not admin user', async () => {
        const adminError = new ChannelAdminError('admin error with user');
        const {team_id: teamId, channel_id: channelId, user_id: userId} = querystring.parse(event[3].body);

        mockCheckSettings.checkIsPreviouslySetup.mockResolvedValue(settings);
        mockCheckSettings.checkIsSetup.mockResolvedValue();
        mockCheckSettings.checkIsAdmin.mockRejectedValue(adminError);
        mockSlackModal.openModal.mockResolvedValue(modal[0]);
        mockSns.promise.mockResolvedValue();

        await expect(router(event[3])).rejects.toBe(adminError);
        expect(mockCheckSettings.checkIsPreviouslySetup).toBeCalledWith(teamId, channelId);
        expect(mockCheckSettings.checkIsSetup).toBeCalledWith(teamId, channelId, settings);
        expect(mockCheckSettings.checkIsAdmin).toBeCalledWith(settings, userId);
      });

      it('should throw unknown error from checkIsPreviouslySetup ', async () => {
        const error = new Error('unknown error');
        const {team_id: teamId, channel_id: channelId} = querystring.parse(event[3].body);

        mockCheckSettings.checkIsPreviouslySetup.mockRejectedValue(error);

        await expect(router(event[3])).rejects.toBe(error);
        expect(mockCheckSettings.checkIsPreviouslySetup).toBeCalledWith(teamId, channelId);
      });

      it('should throw unknown error from checkIsSetup ', async () => {
        const error = new Error('unknown error');
        const {team_id: teamId, channel_id: channelId} = querystring.parse(event[3].body);

        mockCheckSettings.checkIsPreviouslySetup.mockResolvedValue(settings);
        mockCheckSettings.checkIsSetup.mockRejectedValue(error);

        await expect(router(event[3])).rejects.toBe(error);
        expect(mockCheckSettings.checkIsPreviouslySetup).toBeCalledWith(teamId, channelId);
      });
    });

    describe('blacklist', () => {
      it('should open an empty modal', async () => {
        const {team_id: teamId, channel_id: channelId, trigger_id: triggerId, user_id: userId} = querystring.parse(event[4].body);
        const params = {
          Message: JSON.stringify({
            teamId,
            channelId,
            settings,
            viewId: modal[0].view.id,
            userId,
          }),
          TopicArn: settingsBlacklistOpen,
        };

        mockCheckSettings.checkIsSetup.mockResolvedValue(settings);
        mockCheckSettings.checkIsAdmin.mockResolvedValue(true);
        mockSlackModal.openModal.mockResolvedValue(modal[0]);
        mockSns.promise.mockResolvedValue();
        await expect(router(event[4])).resolves.toBe();

        expect(mockCheckSettings.checkIsSetup).toBeCalledWith(teamId, channelId);
        expect(mockCheckSettings.checkIsAdmin).toBeCalledWith(settings, userId);
        expect(mockSlackModal.openModal).toBeCalledWith(teamId, channelId, triggerId, mockConfig.slack.actions.empty_modal, 'Spotbot Blacklist', null, 'Cancel');
        expect(mockSns.publish).toBeCalledWith(params);
      });

      it('should fail when checkIsSetup fails', async () => {
        const {team_id: teamId, channel_id: channelId} = querystring.parse(event[4].body);
        const setupError = new SetupError();
        mockCheckSettings.checkIsSetup.mockRejectedValue(setupError);
        await expect(router(event[4])).rejects.toBe(setupError);

        expect(mockCheckSettings.checkIsSetup).toBeCalledWith(teamId, channelId);
      });

      it('should fail when check admin throws error', async () => {
        const {team_id: teamId, channel_id: channelId, user_id: userId} = querystring.parse(event[4].body);
        const channelError = new ChannelAdminError();
        mockCheckSettings.checkIsSetup.mockResolvedValue(settings);
        mockCheckSettings.checkIsAdmin.mockRejectedValue(channelError);
        await expect(router(event[4])).rejects.toBe(channelError);

        expect(mockCheckSettings.checkIsSetup).toBeCalledWith(teamId, channelId);
        expect(mockCheckSettings.checkIsAdmin).toBeCalledWith(settings, userId);
      });
    });

    describe('device', () => {
      it('should open an empty modal', async () => {
        const {team_id: teamId, channel_id: channelId, trigger_id: triggerId, user_id: userId} = querystring.parse(event[5].body);
        const params = {
          Message: JSON.stringify({
            teamId,
            channelId,
            settings,
            viewId: modal[0].view.id,
            userId,
          }),
          TopicArn: settingsDeviceSelect,
        };

        mockCheckSettings.checkIsSetup.mockResolvedValue(settings);
        mockCheckSettings.checkIsAdmin.mockResolvedValue(true);
        mockSlackModal.openModal.mockResolvedValue(modal[0]);
        mockSns.promise.mockResolvedValue();
        await expect(router(event[5])).resolves.toBe();

        expect(mockCheckSettings.checkIsSetup).toBeCalledWith(teamId, channelId);
        expect(mockCheckSettings.checkIsAdmin).toBeCalledWith(settings, userId);
        expect(mockSlackModal.openModal).toBeCalledWith(teamId, channelId, triggerId, mockConfig.slack.actions.empty_modal, 'Spotify Devices', null, 'Cancel');
        expect(mockSns.publish).toBeCalledWith(params);
      });

      it('should fail when checkIsSetup fails', async () => {
        const {team_id: teamId, channel_id: channelId} = querystring.parse(event[5].body);
        const setupError = new SetupError();
        mockCheckSettings.checkIsSetup.mockRejectedValue(setupError);
        await expect(router(event[5])).rejects.toBe(setupError);

        expect(mockCheckSettings.checkIsSetup).toBeCalledWith(teamId, channelId);
      });

      it('should fail when check admin throws error', async () => {
        const {team_id: teamId, channel_id: channelId, user_id: userId} = querystring.parse(event[5].body);
        const channelError = new ChannelAdminError();
        mockCheckSettings.checkIsSetup.mockResolvedValue(settings);
        mockCheckSettings.checkIsAdmin.mockRejectedValue(channelError);
        await expect(router(event[5])).rejects.toBe(channelError);

        expect(mockCheckSettings.checkIsSetup).toBeCalledWith(teamId, channelId);
        expect(mockCheckSettings.checkIsAdmin).toBeCalledWith(settings, userId);
      });
    });
  });
});
