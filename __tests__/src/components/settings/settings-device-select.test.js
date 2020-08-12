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
  },
};
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSettingsInterface = {
  loadSettings: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyDevices = {
  fetchDevices: jest.fn(),
};
const mockSpotifyStatus = {
  fetchCurrentPlayback: jest.fn(),
};
const mockUtilDevice = jest.fn();
const mockSlackApi = {
  updateModal: jest.fn(),
};
const mockSlackBlocks = {
  textSection: jest.fn(),
};
const mockSlackFormat = {
  selectStatic: jest.fn(),
  option: jest.fn(),
  slackModal: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/db/settings-interface', () => mockSettingsInterface, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-devices', () => mockSpotifyDevices, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-device', () => mockUtilDevice, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackBlocks, {virtual: true});
jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackFormat, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/settings/settings-device-select');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId, viewId} = require('../../../data/request');
const devices = require('../../../data/spotify/device');
const status = require('../../../data/spotify/status');
const params = {
  0: {teamId, channelId, userId, viewId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Settings Device Select', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockAuthSession.authSession.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
    });
  });

  describe('main', () => {
    it('should update the modal with device information', async () => {
      const auth = {auth: true};
      const utilDevice = {name: 'device', id: '123'};
      const text = {textSection: true};
      const option = {option: true};
      const staticSelect = {static: true};
      const modal = {modal: true};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[0]);
      mockSettingsInterface.loadSettings.mockResolvedValue(settings);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockUtilDevice.mockReturnValue(utilDevice);
      mockSlackBlocks.textSection.mockReturnValue(text);
      mockSlackFormat.option.mockReturnValue(option);
      mockSlackFormat.selectStatic.mockReturnValue(staticSelect);
      mockSlackFormat.slackModal.mockReturnValue(modal);
      mockSlackApi.updateModal.mockReturnValue();

      await expect(mod.handler(event(params[0]))).resolves.toBeUndefined();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.default(settings.default_device.name));
      expect(mockUtilDevice).toHaveBeenCalledWith(status[0].device);
      expect(mockSlackFormat.option).toHaveBeenCalledWith(response.current(utilDevice.name), utilDevice.id);
      expect(mockUtilDevice).toHaveBeenCalledWith(devices[0].devices[0]);
      expect(mockSlackFormat.option).toHaveBeenCalledWith(utilDevice.name, utilDevice.id);
      expect(mockSlackFormat.selectStatic).toHaveBeenCalledWith(mockConfig.slack.actions.device_modal, response.title, response.hint, option, [option, option], null);
      expect(mockSlackFormat.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.device_modal, `Spotify Devices`, `Switch to Device`, `Cancel`, [text, staticSelect], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should update the modal with device with null id', async () => {
      const auth = {auth: true};
      const utilDevice = {name: 'device', id: null};
      const text = {textSection: true};
      const option = {option: true};
      const staticSelect = {static: true};
      const modal = {modal: true};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[0]);
      mockSettingsInterface.loadSettings.mockResolvedValue(settings);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[1]);
      mockUtilDevice.mockReturnValue(utilDevice);
      mockSlackBlocks.textSection.mockReturnValue(text);
      mockSlackFormat.option.mockReturnValue(option);
      mockSlackFormat.selectStatic.mockReturnValue(staticSelect);
      mockSlackFormat.slackModal.mockReturnValue(modal);
      mockSlackApi.updateModal.mockReturnValue();

      await expect(mod.handler(event(params[0]))).resolves.toBeUndefined();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.default(settings.default_device.name));
      expect(mockUtilDevice).toHaveBeenCalledWith(status[1].device);
      expect(mockSlackFormat.option).toHaveBeenCalledWith(response.current(utilDevice.name), 'null');
      expect(mockUtilDevice).toHaveBeenCalledWith(devices[0].devices[0]);
      expect(mockSlackFormat.option).toHaveBeenCalledWith(utilDevice.name, utilDevice.id);
      expect(mockSlackFormat.selectStatic).toHaveBeenCalledWith(mockConfig.slack.actions.device_modal, response.title, response.hint, option, [option, option], null);
      expect(mockSlackFormat.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.device_modal, `Spotify Devices`, `Switch to Device`, `Cancel`, [text, staticSelect], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });

    it('should update the modal with no device', async () => {
      const auth = {auth: true};
      const text = {textSection: true};
      const modal = {modal: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[1]);
      mockSlackBlocks.textSection.mockReturnValue(text);
      mockSlackFormat.slackModal.mockReturnValue(modal);

      await expect(mod.handler(event(params[0]))).resolves.toBeUndefined();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.no_device);
      expect(mockSlackFormat.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.device_modal, `Spotify Devices`, null, `Close`, [text], false, channelId);
    });

    it('should update the modal with device information when status is empty', async () => {
      const auth = {auth: true};
      const utilDevice = {name: 'device', id: '123'};
      const text = {textSection: true};
      const option = {option: true};
      const staticSelect = {static: true};
      const modal = {modal: true};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[0]);
      mockSettingsInterface.loadSettings.mockResolvedValue(settings);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue('');
      mockUtilDevice.mockReturnValue(utilDevice);
      mockSlackBlocks.textSection.mockReturnValue(text);
      mockSlackFormat.option.mockReturnValue(option);
      mockSlackFormat.selectStatic.mockReturnValue(staticSelect);
      mockSlackFormat.slackModal.mockReturnValue(modal);
      mockSlackApi.updateModal.mockReturnValue();

      await expect(mod.handler(event(params[0]))).resolves.toBeUndefined();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.default(settings.default_device.name));
      expect(mockSlackFormat.option).toHaveBeenCalledWith(`${devices[0].devices[0].name} - ${devices[0].devices[0].type}`, devices[0].devices[0].id);
      expect(mockSlackFormat.selectStatic).toHaveBeenCalledWith(mockConfig.slack.actions.device_modal, response.title, response.hint, null, [option], null);
      expect(mockSlackFormat.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.device_modal, `Spotify Devices`, `Switch to Device`, `Cancel`, [text, staticSelect], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, modal);
    });
  });
});
