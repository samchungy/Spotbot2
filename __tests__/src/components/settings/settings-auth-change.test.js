const mockSns = {
  publish: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};
const mockSpotifyApiRefresh = {
  invalidateAuth: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/sns', () => mockSns, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/spotify/spotify-auth/spotify-auth-refresh', () => mockSpotifyApiRefresh, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/settings/settings-auth-change');
const response = mod.RESPONSE;

const {teamId, channelId, viewId, userId, url} = require('../../../data/request');
const params = {teamId, channelId, viewId, userId, url};
const event = {
  Records: [{Sns: {Message: JSON.stringify(params)}}],
};

describe('Settings Change Auth', () => {
  describe('handler', () => {
    describe('success', () => {
      it('should call the main function', async () => {
        expect.assertions(1);
        await expect(mod.handler(event)).resolves.toBe();
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mockSpotifyApiRefresh.invalidateAuth.mockRejectedValue(error);

        expect.assertions(3);
        await expect(mod.handler(event)).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should call invalidate auth and call update view sns', async () => {
      mockSpotifyApiRefresh.invalidateAuth.mockResolvedValue();

      expect.assertions(2);
      await expect(mod.handler(event)).resolves.toBe();
      expect(mockSns.publish).toBeCalledWith({'Message': `{"teamId":"${teamId}","channelId":"${channelId}","viewId":"${viewId}","url":"${url}"}`, 'TopicArn': `${process.env.SNS_PREFIX}settings-auth-update-view`});
    });
  });
});
