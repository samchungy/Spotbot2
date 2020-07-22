// Mock Modules
const mockAuth = () => ({
  getAuthBlock: jest.fn(),
});

const mockConfig = () => ({
  slack: {
    actions: {
      settings_modal: 'MODAL',
    },
  },
});

const mockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
});

const mockSlackApi = () => ({
  updateModal: jest.fn(),
});
const mockSlackFormat = () => ({
  slackModal: jest.fn(),
});
const mockSlackErrorReporter = () => ({
  reportErrorToSlack: jest.fn(),
});
const mockSettingsBlocks = () => ({
  getSettingsBlocks: jest.fn(),
});

// Mock Declarations
jest.doMock('../../../src/components/settings/layers/settings-auth-blocks', mockAuth);
jest.doMock('../../../src/components/settings/layers/settings-blocks', mockSettingsBlocks);
jest.doMock('/opt/slack/format/slack-format-modal', mockSlackFormat, {virtual: true});
jest.doMock('/opt/config/config', mockConfig, {virtual: true});
jest.doMock('/opt/utils/util-logger', mockLogger, {virtual: true});
jest.doMock('/opt/slack/slack-api', mockSlackApi, {virtual: true});
jest.doMock('/opt/slack/slack-error-reporter', mockSlackErrorReporter, {virtual: true});

const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const {updateModal} = require('/opt/slack/slack-api');
const {slackModal} = require('/opt/slack/format/slack-format-modal');
const {reportErrorToSlack} = require('/opt/slack/slack-error-reporter');
const {getAuthBlock} = require('../../../src/components/settings/layers/settings-auth-blocks');
const {getSettingsBlocks} = require('../../../src/components/settings/layers/settings-blocks');

const mod = require('../../../src/components/settings/settings-open');
const main = mod.__get__('main');
const response = mod.__get__('RESPONSE');

const {teamId, channelId, settings, viewId, userId, url} = require('../../data/request');
const params = {teamId, channelId, settings, viewId, userId, url};
const parameters = [teamId, channelId, settings, viewId, url];

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

  describe('main', () => {
    it('should get an authenticated settings block', async () => {
      getAuthBlock.mockResolvedValue({authBlock: [{auth: 'block'}], authError: false});
      getSettingsBlocks.mockResolvedValue([{settings: 'block'}]);
      slackModal.mockReturnValue({modal: 'slack'});

      expect.assertions(4);
      await expect(main(...parameters)).resolves.toBe();
      expect(getAuthBlock).toHaveBeenCalledWith(teamId, channelId, viewId, url);
      expect(slackModal).toHaveBeenCalledWith(config.slack.actions.settings_modal, `Spotbot Settings`, `Save`, `Cancel`, [{auth: 'block'}, {settings: 'block'}], false, channelId);
      expect(updateModal).toHaveBeenCalledWith(viewId, {modal: 'slack'});
    });

    it('should get an unauthenticated settings block', async () => {
      getAuthBlock.mockResolvedValue({authBlock: [{auth: 'block'}], authError: true});
      getSettingsBlocks.mockResolvedValue([{settings: 'block'}]);
      slackModal.mockReturnValue({modal: 'slack'});

      expect.assertions(4);
      await expect(main(...parameters)).resolves.toBe();
      expect(getAuthBlock).toHaveBeenCalledWith(teamId, channelId, viewId, url);
      expect(slackModal).toHaveBeenCalledWith(config.slack.actions.settings_modal, `Spotbot Settings`, null, `Close`, [{auth: 'block'}], false, channelId);
      expect(updateModal).toHaveBeenCalledWith(viewId, {modal: 'slack'});
    });
  });
});

