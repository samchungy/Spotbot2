// Mock Modules
const mockAuth = {
  getAuthBlock: jest.fn(),
};

const mockConfig = {
  slack: {
    actions: {
      settings_modal: 'MODAL',
    },
  },
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const mockSlackApi = {
  updateModal: jest.fn(),
};
const mockSlackFormat = {
  slackModal: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockSettingsBlocks = {
  getSettingsBlocks: jest.fn(),
};

// Mock Declarations
jest.mock('../../../../src/components/settings/layers/settings-auth-blocks', () => mockAuth);
jest.mock('../../../../src/components/settings/layers/settings-blocks', () => mockSettingsBlocks);
jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackFormat, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/settings/settings-open');
const response = mod.RESPONSE;

const {teamId, channelId, settings, viewId, userId, url} = require('../../../data/request');
const params = {teamId, channelId, settings, viewId, userId, url};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Get Settings Blocks', () => {
  describe('handler', () => {
    describe('success', () => {
      it('should call the main function', async () => {
        await expect(mod.handler(event(params))).resolves.toBe();
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mockAuth.getAuthBlock.mockRejectedValue(error);

        await expect(mod.handler(event(params))).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should get an authenticated settings block', async () => {
      mockAuth.getAuthBlock.mockResolvedValue({authBlock: [{auth: 'block'}], authError: false});
      mockSettingsBlocks.getSettingsBlocks.mockResolvedValue([{settings: 'block'}]);
      mockSlackFormat.slackModal.mockReturnValue({modal: 'slack'});

      await expect(mod.handler(event(params))).resolves.toBe();
      expect(mockAuth.getAuthBlock).toHaveBeenCalledWith(teamId, channelId, viewId, url);
      expect(mockSettingsBlocks.getSettingsBlocks).toBeCalledWith(settings);
      expect(mockSlackFormat.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.settings_modal, `Spotbot Settings`, `Save`, `Cancel`, [{auth: 'block'}, {settings: 'block'}], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, {modal: 'slack'});
    });

    it('should get an unauthenticated settings block', async () => {
      mockAuth.getAuthBlock.mockResolvedValue({authBlock: [{auth: 'block'}], authError: true});
      mockSettingsBlocks.getSettingsBlocks.mockResolvedValue([{settings: 'block'}]);
      mockSlackFormat.slackModal.mockReturnValue({modal: 'slack'});

      await expect(mod.handler(event(params))).resolves.toBe();
      expect(mockAuth.getAuthBlock).toHaveBeenCalledWith(teamId, channelId, viewId, url);
      expect(mockSlackFormat.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.settings_modal, `Spotbot Settings`, null, `Close`, [{auth: 'block'}], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, {modal: 'slack'});
    });
  });
});

