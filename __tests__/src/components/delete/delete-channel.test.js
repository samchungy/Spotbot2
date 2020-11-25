const mockLogger = {
  error: jest.fn(),
};
const mockSettings = {
  removeAllSettings: jest.fn(),
  searchAllSettings: jest.fn(),
};
const mockAuthInterface = {
  removeAuth: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/db/settings-interface', () => mockSettings, {virtual: true});
jest.mock('/opt/db/spotify-auth-interface', () => mockAuthInterface, {virtual: true});

const mod = require('../../../../src/components/delete/delete-channel');
const response = mod.RESPONSE;
const {teamId, channelId, settings} = require('../../../data/request');
const params = {
  0: {teamId, channelId, settings},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Delete Channel', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockSettings.searchAllSettings.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
    });
  });

  describe('Main', () => {
    it('should successfully delete channel settings', async () => {
      const setting = {name: 'setting'};
      const settings = [setting, setting, setting];
      mockSettings.searchAllSettings.mockResolvedValue(settings);
      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSettings.searchAllSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeAuth).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettings.removeAllSettings).toHaveBeenCalledWith(teamId, channelId, ['setting', 'setting', 'setting']);
    });

    it('should not do anything', async () => {
      const settings = [];
      mockSettings.searchAllSettings.mockResolvedValue(settings);
      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSettings.searchAllSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeAuth).not.toHaveBeenCalled();
    });
  });
});
