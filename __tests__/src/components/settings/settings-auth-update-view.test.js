const mockConfig = {
  slack: {
    actions: {
      settings_modal: 'SETTINGS_MODAL',
    },
  },
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

const mockSlackApi = {
  updateModal: jest.fn(),
};

const mockSlackFormat = {
  slackModal: jest.fn(),
};

const mockSettingsInterface = {
  loadSettings: jest.fn(),
};

const mockAuth = {
  getAuthBlock: jest.fn(),
};

const mockSettingsBlocks = {
  getSettingsBlocks: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});
jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackFormat, {virtual: true});
jest.mock('/opt/db/settings-interface', () => mockSettingsInterface, {virtual: true});
jest.mock('../../../../src/components/settings/layers/settings-auth-blocks', () => mockAuth);
jest.mock('../../../../src/components/settings/layers/settings-blocks', () => mockSettingsBlocks);

const mod = require('../../../../src/components/settings/settings-auth-update-view');
const response = mod.RESPONSE;

const {teamId, channelId, settings, viewId, url} = require('../../../data/request');
const params = {teamId, channelId, viewId, url};
const event = {
  Records: [{Sns: {Message: JSON.stringify(params)}}],
};

describe('Update View with Auth', () => {
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
        mockSettingsInterface.loadSettings.mockRejectedValue(error);

        expect.assertions(3);
        await expect(mod.handler(event)).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, null, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should get an authenticated settings block and update our modal', async () => {
      mockSettingsInterface.loadSettings.mockResolvedValue(settings);
      mockAuth.getAuthBlock.mockResolvedValue({authBlock: [{auth: 'block'}], authError: false});
      mockSettingsBlocks.getSettingsBlocks.mockResolvedValue([{settings: 'block'}]);
      mockSlackFormat.slackModal.mockReturnValue({modal: 'slack'});

      expect.assertions(5);
      await expect(mod.handler(event)).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toBeCalledWith(teamId, channelId);
      expect(mockAuth.getAuthBlock).toHaveBeenCalledWith(teamId, channelId, viewId, url);
      expect(mockSlackFormat.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.settings_modal, `Spotbot Settings`, `Save`, `Cancel`, [{auth: 'block'}, {settings: 'block'}], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, {modal: 'slack'});
    });

    it('should get an unauthenticated settings block', async () => {
      mockSettingsInterface.loadSettings.mockResolvedValue(settings);
      mockAuth.getAuthBlock.mockResolvedValue({authBlock: [{auth: 'block'}], authError: true});
      mockSettingsBlocks.getSettingsBlocks.mockResolvedValue([{settings: 'block'}]);
      mockSlackFormat.slackModal.mockReturnValue({modal: 'slack'});

      expect.assertions(5);
      await expect(mod.handler(event)).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toBeCalledWith(teamId, channelId);
      expect(mockAuth.getAuthBlock).toHaveBeenCalledWith(teamId, channelId, viewId, url);
      expect(mockSlackFormat.slackModal).toHaveBeenCalledWith(mockConfig.slack.actions.settings_modal, `Spotbot Settings`, null, `Close`, [{auth: 'block'}], false, channelId);
      expect(mockSlackApi.updateModal).toHaveBeenCalledWith(viewId, {modal: 'slack'});
    });
  });
});
