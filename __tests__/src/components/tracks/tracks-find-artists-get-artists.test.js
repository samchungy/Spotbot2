const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockGetArtists = {
  showResults: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('../../../../src/components/tracks/layers/get-artists', () => mockGetArtists, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/tracks/tracks-find-artists-get-artists');
const response = mod.RESPONSE;
const {teamId, channelId, userId, responseUrl, triggerId} = require('../../../data/request');
const params = {
  0: {teamId, channelId, userId, responseUrl, triggerId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Get Artists', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      mockGetArtists.showResults.mockResolvedValue();
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockGetArtists.showResults.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
    });
  });
});
