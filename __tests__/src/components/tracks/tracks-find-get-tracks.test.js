const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockGetTracks = {
  showResults: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('../../../../src/components/tracks/layers/get-tracks', () => mockGetTracks, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/tracks/tracks-find-get-tracks');
const response = mod.RESPONSE;
const {teamId, channelId, userId, responseUrl, triggerId} = require('../../../data/request');
const params = {
  0: {teamId, channelId, userId, responseUrl, triggerId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Get Tracks', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      mockGetTracks.showResults.mockResolvedValue();
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockGetTracks.showResults.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, userId, response.failed);
    });
  });
});
