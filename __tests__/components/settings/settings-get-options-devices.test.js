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
const momentMock = {
  tz: jest.fn().mockReturnThis(),
  format: jest.fn(),
  add: jest.fn(),
  unix: jest.fn(),
  names: jest.fn(),
};

const mockMoment = () => {
  const mock = () => momentMock;
  mock.tz = momentMock;
  return mock;
};

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
  modelDevice: jest.fn().mockReturnValue({name: 'name', id: 'id'}),
  storeDevices: jest.fn(),
};
const mockDevices = {
  fetchDevices: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn().mockResolvedValue({'auth': true}),
};
const mockUtilDevice = jest.fn().mockImplementation(jest.fn().mockReturnValue({name: 'name', id: 'id'}));

// Mock Declarations
jest.doMock('/opt/config/config', () => mockConfig, {virtual: true});
jest.doMock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.doMock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', mockMoment, {virtual: true});
jest.doMock('/opt/slack/format/slack-format-modal', () => mockSlackFormat, {virtual: true});
jest.doMock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});
jest.doMock('/opt/db/settings-interface', () => mockSettings, {virtual: true});
jest.doMock('/opt/spotify/spotify-api/spotify-api-devices', () => mockDevices, {virtual: true});
jest.doMock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.doMock('/opt/spotify/spotify-objects/util-spotify-device', () => mockUtilDevice, {virtual: true});

const mod = require('../../../src/components/settings/settings-get-options-devices');
const main = mod.__get__('main');
const response = mod.__get__('RESPONSE');
const deviceData = require('../../data/spotify/device');
const {teamId, channelId, userId, settings} = require('../../data/request');
const params = {teamId, channelId, userId, settings};
const parameters = [teamId, channelId, settings];

describe('Get Device Options', () => {
  describe('handler', () => {
    afterAll(() => {
      mod.__ResetDependency__('main');
    });
    const event = params;
    describe('success', () => {
      it('should call the main function', async () => {
        mod.__set__('main', () => Promise.resolve());

        expect.assertions(1);
        await expect(mod.handler(event)).resolves.toBe();
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mod.__set__('main', () => Promise.reject(error));

        expect.assertions(3);
        await expect(mod.handler(event)).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should return a Slack option containing a Spotify device', async () => {
      mockDevices.fetchDevices.mockResolvedValue(deviceData[0]);
      momentMock.add.mockReturnThis();
      momentMock.unix.mockReturnValue(1111111111);

      expect.assertions(5);
      await expect(main(...parameters)).resolves.toStrictEqual(
          {'options': [{'text': 'no_devices_label', 'value': 'no_devices'}, {'text': 'AU13282 - Computer', 'value': '87997bb4312981a00f1d8029eb874c55a211a0cc'}, {'text': 'name', 'value': 'id'}]},
      );
      expect(mockDevices.fetchDevices).toHaveBeenCalledWith(teamId, channelId, {'auth': true});
      expect(mockSettings.storeDevices).toHaveBeenCalledWith(teamId, channelId, {'value': [{'id': '87997bb4312981a00f1d8029eb874c55a211a0cc', 'name': 'AU13282 - Computer'}, {'id': 'id', 'name': 'name'}]}, 1111111111);
      expect(momentMock.add).toHaveBeenCalledWith(1, 'hour');
      expect(momentMock.unix).toHaveBeenCalled();
    });

    it('should return a Slack option containing only the default device', async () => {
      mockDevices.fetchDevices.mockResolvedValue(deviceData[1]);
      momentMock.add.mockReturnThis();
      momentMock.unix.mockReturnValue(1111111111);

      expect.assertions(5);
      await expect(main(...parameters)).resolves.toStrictEqual(
          {'options': [{'text': 'no_devices_label', 'value': 'no_devices'}, {'text': 'AU13282 - Computer', 'value': '87997bb4312981a00f1d8029eb874c55a211a0cc'}]},
      );
      expect(mockDevices.fetchDevices).toHaveBeenCalledWith(teamId, channelId, {'auth': true});
      expect(mockSettings.storeDevices).toHaveBeenCalledWith(teamId, channelId, {'value': [{'id': '87997bb4312981a00f1d8029eb874c55a211a0cc', 'name': 'AU13282 - Computer'}]}, 1111111111);
      expect(momentMock.add).toHaveBeenCalledWith(1, 'hour');
      expect(momentMock.unix).toHaveBeenCalled();
    });

    it('should return a Slack option containing a none option', async () => {
      mockDevices.fetchDevices.mockResolvedValue(deviceData[1]);
      momentMock.add.mockReturnThis();
      momentMock.unix.mockReturnValue(1111111111);

      expect.assertions(5);
      await expect(main(teamId, channelId, undefined)).resolves.toStrictEqual(
          {'options': [{'text': 'no_devices_label', 'value': 'no_devices'}]},
      );
      expect(mockDevices.fetchDevices).toHaveBeenCalledWith(teamId, channelId, {'auth': true});
      expect(mockSettings.storeDevices).toHaveBeenCalledWith(teamId, channelId, {'value': []}, 1111111111);
      expect(momentMock.add).toHaveBeenCalledWith(1, 'hour');
      expect(momentMock.unix).toHaveBeenCalled();
    });
  });
});

