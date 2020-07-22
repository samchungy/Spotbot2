const mockSns = () => ({
  sns: jest.fn(),
});
const mockSpotifyApiRefresh = () => ({
  invalidateAuth: jest.fn(),
});

const mockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
});
const mockSlackErrorReporter = () => ({
  reportErrorToSlack: jest.fn(),
});

jest.doMock('/opt/sns', mockSns, {virtual: true});
jest.doMock('/opt/utils/util-logger', mockLogger, {virtual: true});
jest.doMock('/opt/spotify/spotify-api/spotify-api-refresh', mockSpotifyApiRefresh, {virtual: true});
jest.doMock('/opt/slack/slack-error-reporter', mockSlackErrorReporter, {virtual: true});

const logger = require('/opt/utils/util-logger');
const sns = require('/opt/sns');
const {invalidateAuth} = require('/opt/spotify/spotify-api/spotify-api-refresh');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');

describe('Get Settings Blocks', () => {
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
        expect(logger.error).toHaveBeenCalledWith(error, response.failed);
        expect(reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  // describe('main', () => {
  //   it('should get an authenticated settings block', async () => {
  //     getAuthBlock.mockResolvedValue({authBlock: [{auth: 'block'}], authError: false});
  //     getSettingsBlocks.mockResolvedValue([{settings: 'block'}]);
  //     slackModal.mockReturnValue({modal: 'slack'});

  //     expect.assertions(4);
  //     await expect(main(...parameters)).resolves.toBe();
  //     expect(getAuthBlock).toHaveBeenCalledWith(teamId, channelId, viewId, url);
  //     expect(slackModal).toHaveBeenCalledWith(config.slack.actions.settings_modal, `Spotbot Settings`, `Save`, `Cancel`, [{auth: 'block'}, {settings: 'block'}], false, channelId);
  //     expect(updateModal).toHaveBeenCalledWith(viewId, {modal: 'slack'});
  //   });

  //   it('should get an unauthenticated settings block', async () => {
  //     getAuthBlock.mockResolvedValue({authBlock: [{auth: 'block'}], authError: true});
  //     getSettingsBlocks.mockResolvedValue([{settings: 'block'}]);
  //     slackModal.mockReturnValue({modal: 'slack'});

  //     expect.assertions(4);
  //     await expect(main(...parameters)).resolves.toBe();
  //     expect(getAuthBlock).toHaveBeenCalledWith(teamId, channelId, viewId, url);
  //     expect(slackModal).toHaveBeenCalledWith(config.slack.actions.settings_modal, `Spotbot Settings`, null, `Close`, [{auth: 'block'}], false, channelId);
  //     expect(updateModal).toHaveBeenCalledWith(viewId, {modal: 'slack'});
  //   });
  // });
});
