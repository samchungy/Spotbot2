// Mock Functions
const config = {
  dynamodb: {
    settings_helper: {
      no_devices: 'no_devices',
      no_devices_label: 'no_devices_label',
      create_new_playlist: 'create_new_playlist.',
    },
    settings: {
      default_device: 'default_device',
    },
  },
};
const logger = {
  info: jest.fn(),
  error: jest.fn(),
};
const moment = {
  add: jest.fn(),
  unix: jest.fn(),
};
const reportErrorToSlack = jest.fn();
const storeDevices = jest.fn();
const fetchDevices = jest.fn();

// Mock Modules
const mockMoment = () => () => ({
  add: moment.add,
  unix: moment.unix,
});
const mockConfig = () => config;
const mockLogger = () => ({
  info: logger.info,
  error: logger.error,
});
const mockSlackFormat = () => ({
  option: jest.fn().mockImplementation((name, value) => ({text: name, value: value})),
});
const mockSlackErrorReporter = () => ({
  reportErrorToSlack: reportErrorToSlack,
});
const mockSettings = () => ({
  modelDevice: jest.fn().mockReturnValue({name: 'name', id: 'id'}),
  storeDevices: storeDevices,
});
const mockDevices = () => ({
  fetchDevices: fetchDevices,
});
const mockAuthSession = () => ({
  authSession: jest.fn().mockResolvedValue({'auth': true}),
});
const mockUtilDevice = () => jest.fn().mockImplementation(jest.fn().mockReturnValue({name: 'name', id: 'id'}));

// Mock Declarations
jest.doMock('/opt/config/config', mockConfig, {virtual: true});
jest.doMock('/opt/utils/util-logger', mockLogger, {virtual: true});
jest.doMock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', mockMoment, {virtual: true});
jest.doMock('/opt/slack/format/slack-format-modal', mockSlackFormat, {virtual: true});
jest.doMock('/opt/slack/slack-error-reporter', mockSlackErrorReporter, {virtual: true});
jest.doMock('/opt/db/settings-interface', mockSettings, {virtual: true});
jest.doMock('/opt/spotify/spotify-api/spotify-api-devices', mockDevices, {virtual: true});
jest.doMock('/opt/spotify/spotify-auth/spotify-auth-session', mockAuthSession, {virtual: true});
jest.doMock('/opt/spotify/spotify-objects/util-spotify-device', mockUtilDevice, {virtual: true});

const mod = require('../../../src/components/settings/settings-get-options-devices');
const startFetchingDevices = mod.__get__('startFetchingDevices');
const response = mod.__get__('RESPONSE');
const deviceData = require('../../data/spotify/device');
const {teamId, channelId, userId, settings} = require('../../data/request');
const params = {teamId, channelId, userId, settings};
const parameters = [teamId, channelId, settings];

describe('Get Device Options', () => {
  describe('handler', () => {
    afterAll(() => {
      mod.__ResetDependency__('startFetchingDevices');
    });
    const event = params;
    describe('success', () => {
      it('should call the main function', async () => {
        mod.__set__('startFetchingDevices', () => Promise.resolve());

        expect.assertions(1);
        await expect(mod.handler(event)).resolves.toBe();
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mod.__set__('startFetchingDevices', () => Promise.reject(error));

        expect.assertions(3);
        await expect(mod.handler(event)).resolves.toBe();
        expect(logger.error).toHaveBeenCalledWith(error, response.failed);
        expect(reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should return a Slack option containing a Spotify device', async () => {
      fetchDevices.mockResolvedValue(deviceData[0]);
      moment.add.mockReturnThis();
      moment.unix.mockReturnValue(1111111111);

      expect.assertions(5);
      await expect(startFetchingDevices(...parameters)).resolves.toStrictEqual(
          {'options': [{'text': 'no_devices_label', 'value': 'no_devices'}, {'text': 'AU13282 - Computer', 'value': '87997bb4312981a00f1d8029eb874c55a211a0cc'}, {'text': 'name', 'value': 'id'}]},
      );
      expect(fetchDevices).toHaveBeenCalledWith(teamId, channelId, {'auth': true});
      expect(storeDevices).toHaveBeenCalledWith(teamId, channelId, {'value': [{'id': '87997bb4312981a00f1d8029eb874c55a211a0cc', 'name': 'AU13282 - Computer'}, {'id': 'id', 'name': 'name'}]}, 1111111111);
      expect(moment.add).toHaveBeenCalledWith(1, 'hour');
      expect(moment.unix).toHaveBeenCalled();
    });

    it('should return a Slack option containing only the default device', async () => {
      fetchDevices.mockResolvedValue(deviceData[1]);
      moment.add.mockReturnThis();
      moment.unix.mockReturnValue(1111111111);

      expect.assertions(5);
      await expect(startFetchingDevices(...parameters)).resolves.toStrictEqual(
          {'options': [{'text': 'no_devices_label', 'value': 'no_devices'}, {'text': 'AU13282 - Computer', 'value': '87997bb4312981a00f1d8029eb874c55a211a0cc'}]},
      );
      expect(fetchDevices).toHaveBeenCalledWith(teamId, channelId, {'auth': true});
      expect(storeDevices).toHaveBeenCalledWith(teamId, channelId, {'value': [{'id': '87997bb4312981a00f1d8029eb874c55a211a0cc', 'name': 'AU13282 - Computer'}]}, 1111111111);
      expect(moment.add).toHaveBeenCalledWith(1, 'hour');
      expect(moment.unix).toHaveBeenCalled();
    });

    it('should return a Slack option containing a none option', async () => {
      fetchDevices.mockResolvedValue(deviceData[1]);
      moment.add.mockReturnThis();
      moment.unix.mockReturnValue(1111111111);

      expect.assertions(5);
      await expect(startFetchingDevices(teamId, channelId, undefined)).resolves.toStrictEqual(
          {'options': [{'text': 'no_devices_label', 'value': 'no_devices'}]},
      );
      expect(fetchDevices).toHaveBeenCalledWith(teamId, channelId, {'auth': true});
      expect(storeDevices).toHaveBeenCalledWith(teamId, channelId, {'value': []}, 1111111111);
      expect(moment.add).toHaveBeenCalledWith(1, 'hour');
      expect(moment.unix).toHaveBeenCalled();
    });
  });
});

