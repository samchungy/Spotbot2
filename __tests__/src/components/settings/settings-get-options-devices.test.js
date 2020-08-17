/* eslint-disable no-unused-vars */
// Mock Functions
const mockConfig = {
  dynamodb: {
    settings_helper: {
      no_devices: 'no_devices',
      no_devices_label: 'no_devices_label',
      create_new_playlist: 'create_new_playlist.',
    },
    settings: {
      default_device: 'default_device',
      playlist: 'playlist',
    },
  },
  spotify_api: {
    playlists: {
      limit: 100,
    },
  },
};

// Mock Modules
const mockMoment = {
  tz: jest.fn().mockReturnThis(),
  format: jest.fn(),
  add: jest.fn(),
  unix: jest.fn(),
  names: jest.fn(),
};
const mockMom = jest.fn(() => mockMoment);
mockMom.tz = jest.fn(() => mockMoment);

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSlackFormat = {
  option: jest.fn().mockImplementation((name, value) => ({text: name, value: value})),
  optionGroup: jest.fn().mockImplementation((name, value) => ({text: name, value: value})),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

const mockSettings = {
  modelDevice: jest.fn(),
  storeDevices: jest.fn(),
};
const mockDevices = {
  fetchDevices: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockUtilDevice = jest.fn();

// Mock Declarations
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});
jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackFormat, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});
jest.mock('/opt/db/settings-interface', () => mockSettings, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-devices', () => mockDevices, {virtual: true});
jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-device', () => mockUtilDevice, {virtual: true});

const mod = require('../../../../src/components/settings/settings-get-options-devices');
const response = mod.RESPONSE;
const deviceData = require('../../../data/spotify/device');
const {teamId, channelId, userId, settings} = require('../../../data/request');
const params = {
  0: {teamId, channelId, userId, settings},
  1: {teamId, channelId, userId, settings: undefined},
};

describe('Get Device Options', () => {
  describe('handler', () => {
    describe('success', () => {
      it('should call the main function', async () => {
        const event = params[0];
        expect.assertions(1);
        await expect(mod.handler(event)).resolves.toBe();
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const event = params[0];
        const error = new Error();
        mockAuthSession.authSession.mockRejectedValue(error);

        expect.assertions(3);
        await expect(mod.handler(event)).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    beforeEach(() => {
      mockMom.mockImplementation(() => mockMoment);
    });
    it('should return a Slack option containing a Spotify device', async () => {
      const event = params[0];

      const auth = {auth: true};
      const modelDevice = {name: 'name', id: 'id'};
      const utilDevice = {name: 'name', id: 'id', util: true};
      const option = {option: true};
      const unix = 1111111111;
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockDevices.fetchDevices.mockResolvedValue(deviceData[0]);
      mockUtilDevice.mockReturnValue(utilDevice);
      mockMoment.unix.mockReturnValue(unix);
      mockMoment.add.mockReturnThis();
      mockSettings.modelDevice.mockReturnValue(modelDevice);
      mockSlackFormat.option.mockReturnValue(option);
      mockSettings.storeDevices.mockResolvedValue();

      await expect(mod.handler(event)).resolves.toStrictEqual(
          {'options': [option, option, option]},
      );
      expect(mockAuthSession.authSession).toBeCalledWith(teamId, channelId);
      expect(mockDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockUtilDevice).toBeCalledWith(expect.objectContaining({id: deviceData[0].devices[0].id}));
      expect(mockSettings.modelDevice).toBeCalledWith(utilDevice.name, utilDevice.id);
      expect(mockMoment.add).toHaveBeenCalledWith(1, 'hour');
      expect(mockMoment.unix).toHaveBeenCalled();
      expect(mockSettings.storeDevices).toBeCalledWith(teamId, channelId, {value: [settings.default_device, modelDevice]}, unix);
      expect(mockSlackFormat.option).toBeCalledWith(mockConfig.dynamodb.settings_helper.no_devices_label, mockConfig.dynamodb.settings_helper.no_devices);
      expect(mockSlackFormat.option).toBeCalledWith(modelDevice.name, modelDevice.id);
      expect(mockSlackFormat.option).toBeCalledWith(settings.default_device.name, settings.default_device.id);
    });

    it('should return a Slack option containing only the default device', async () => {
      const event = params[0];

      const auth = {auth: true};
      const option = {option: true};
      const unix = 1111111111;
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockDevices.fetchDevices.mockResolvedValue(deviceData[1]);
      mockMoment.unix.mockReturnValue(unix);
      mockMoment.add.mockReturnThis();
      mockSlackFormat.option.mockReturnValue(option);
      mockSettings.storeDevices.mockResolvedValue();

      await expect(mod.handler(event)).resolves.toStrictEqual(
          {'options': [option, option]},
      );
      expect(mockAuthSession.authSession).toBeCalledWith(teamId, channelId);
      expect(mockDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockMoment.add).toHaveBeenCalledWith(1, 'hour');
      expect(mockMoment.unix).toHaveBeenCalled();
      expect(mockSettings.storeDevices).toBeCalledWith(teamId, channelId, {value: [settings.default_device]}, unix);
      expect(mockSlackFormat.option).toBeCalledWith(mockConfig.dynamodb.settings_helper.no_devices_label, mockConfig.dynamodb.settings_helper.no_devices);
      expect(mockSlackFormat.option).toBeCalledWith(settings.default_device.name, settings.default_device.id);
    });

    it('should return a Slack option containing only the none device option', async () => {
      const event = params[1];

      const auth = {auth: true};
      const option = {option: true};
      const unix = 1111111111;
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockDevices.fetchDevices.mockResolvedValue(deviceData[1]);
      mockMoment.unix.mockReturnValue(unix);
      mockMoment.add.mockReturnThis();
      mockSlackFormat.option.mockReturnValue(option);
      mockSettings.storeDevices.mockResolvedValue();

      await expect(mod.handler(event)).resolves.toStrictEqual({'options': [{'option': true}]});
      expect(mockAuthSession.authSession).toBeCalledWith(teamId, channelId);
      expect(mockDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockMoment.add).toHaveBeenCalledWith(1, 'hour');
      expect(mockMoment.unix).toHaveBeenCalled();
      expect(mockSettings.storeDevices).toBeCalledWith(teamId, channelId, {value: []}, unix);
      expect(mockSlackFormat.option).toBeCalledWith(mockConfig.dynamodb.settings_helper.no_devices_label, mockConfig.dynamodb.settings_helper.no_devices);
    });
  });
});

