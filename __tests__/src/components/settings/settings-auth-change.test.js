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

jest.doMock('/opt/sns', () => mockSns, {virtual: true});
jest.doMock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.doMock('/opt/spotify/spotify-auth/spotify-auth-refresh', () => mockSpotifyApiRefresh, {virtual: true});
jest.doMock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/settings/settings-auth-change');
const main = mod.__get__('main');
const response = mod.__get__('RESPONSE');

const {teamId, channelId, viewId, userId, url} = require('../../../data/request');
const params = {teamId, channelId, viewId, userId, url};
const parameters = [teamId, channelId, viewId, url];

describe('Settings Change Auth', () => {
  describe('handler', () => {
    afterAll(() => {
      mod.__ResetDependency__('main');
    });
    const event = {
      Records: [{Sns: {Message: JSON.stringify(params)}}],
    };
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
    it('should call invalidate auth and call update view sns', async () => {
      mockSpotifyApiRefresh.invalidateAuth.mockResolvedValue();

      expect.assertions(2);
      await expect(main(...parameters)).resolves.toBe();
      expect(mockSns.publish).toBeCalledWith({'Message': `{"teamId":"${teamId}","channelId":"${channelId}","viewId":"${viewId}","url":"${url}"}`, 'TopicArn': `${process.env.SNS_PREFIX}settings-auth-update-view`});
    });
  });
});
