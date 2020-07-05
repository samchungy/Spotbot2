// Mock Functions
const getAuthBlock = jest.fn();
const getSettingsBlocks = jest.fn();
const logger = {
  info: jest.fn(),
  error: jest.fn(),
};
const updateModal = jest.fn();
const slackModal = jest.fn();
const reportErrorToSlack = jest.fn();
const config = {
  slack: {
    actions: {
      settings_modal: 'MODAL',
    },
  },
};

// Mock Modules
const mockAuth = () => ({
  getAuthBlock: getAuthBlock,
});

const mockConfig = () => config;

const mockLogger = () => ({
  info: logger.info,
  error: logger.error,
});

const mockSlackApi = () => ({
  updateModal: updateModal,
});

const mockSlackFormat = () => ({
  slackModal: slackModal,
});

const mockSlackErrorReporter = () => ({
  reportErrorToSlack: reportErrorToSlack,
});

const mockSettingsBlocks = () => ({
  getSettingsBlocks: getSettingsBlocks,
});

// Mock Declarations
jest.doMock('../../../src/components/settings/layers/settings-auth-blocks', mockAuth);
jest.doMock('../../../src/components/settings/layers/settings-blocks', mockSettingsBlocks);
jest.doMock('/opt/slack/format/slack-format-modal', mockSlackFormat);
jest.doMock('/opt/config/config', mockConfig);
jest.doMock('/opt/utils/util-logger', mockLogger);
jest.doMock('/opt/slack/slack-api', mockSlackApi);
jest.doMock('/opt/slack/slack-error-reporter', mockSlackErrorReporter);

const mod = require('../../../src/components/settings/settings-open');
const openSettings = mod.__get__('openSettings');
const response = mod.__get__('RESPONSE');

const {teamId, channelId, settings, viewId, userId, url} = require('../../data/request');
const params = {teamId, channelId, settings, viewId, userId, url};
const parameters = [teamId, channelId, settings, viewId, url];

describe('Get Settings Blocks', () => {
  describe('handler', () => {
    afterAll(() => {
      mod.__ResetDependency__('openSettings');
    });
    const event = {
      Records: [{Sns: {Message: JSON.stringify(params)}}],
    };
    describe('success', () => {
      it('should call the main function', async () => {
        mod.__set__('openSettings', () => Promise.resolve());

        expect.assertions(1);
        await expect(mod.handler(event)).resolves.toBe();
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mod.__set__('openSettings', () => Promise.reject(error));

        expect.assertions(3);
        await expect(mod.handler(event)).resolves.toBe();
        expect(logger.error).toHaveBeenCalledWith(error, response.failed);
        expect(reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should get an authenticated settings block', async () => {
      getAuthBlock.mockResolvedValue({authBlock: [{auth: 'block'}], authError: false});
      getSettingsBlocks.mockResolvedValue([{settings: 'block'}]);
      slackModal.mockReturnValue({modal: 'slack'});

      expect.assertions(4);
      await expect(openSettings(...parameters)).resolves.toBe();
      expect(getAuthBlock).toHaveBeenCalledWith(teamId, channelId, viewId, url);
      expect(slackModal).toHaveBeenCalledWith(config.slack.actions.settings_modal, `Spotbot Settings`, `Save`, `Cancel`, [{auth: 'block'}, {settings: 'block'}], false, channelId);
      expect(updateModal).toHaveBeenCalledWith(viewId, {modal: 'slack'});
    });

    it('should get an unauthenticated settings block', async () => {
      getAuthBlock.mockResolvedValue({authBlock: [{auth: 'block'}], authError: true});
      getSettingsBlocks.mockResolvedValue([{settings: 'block'}]);
      slackModal.mockReturnValue({modal: 'slack'});

      expect.assertions(4);
      await expect(openSettings(...parameters)).resolves.toBe();
      expect(getAuthBlock).toHaveBeenCalledWith(teamId, channelId, viewId, url);
      expect(slackModal).toHaveBeenCalledWith(config.slack.actions.settings_modal, `Spotbot Settings`, null, `Close`, [{auth: 'block'}], false, channelId);
      expect(updateModal).toHaveBeenCalledWith(viewId, {modal: 'slack'});
    });
  });
});

