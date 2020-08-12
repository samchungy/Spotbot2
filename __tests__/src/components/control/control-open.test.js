const mockConfig = {
  slack: {
    'actions': {
      'blacklist_modal': 'blacklist_modal',
      'sonos_modal': 'sonos_modal',
      'settings_modal': 'settings_modal',
      'device_modal': 'device_modal',
      'empty_modal': 'empty_modal',
      'remove_modal': 'remove_modal',
      'reset_modal': 'reset_modal',
      'playlist': 'playlist',
      'block_actions': 'block_actions',
      'view_submission': 'view_submission',
      'view_closed': 'view_closed',
      'controller': 'controller',
      'controller_overflow': 'controller_overflow',
      'reset_review_confirm': 'reset_review_confirm',
      'reset_review_deny': 'reset_review_deny',
      'reset_review_jump': 'reset_review_jump',
      'controls': {
        'play': 'play',
        'pause': 'pause',
        'skip': 'skip',
        'reset': 'reset',
        'clear_one': 'clear_one',
        'jump_to_start': 'jump_to_start',
        'shuffle': 'shuffle',
        'repeat': 'repeat',
      },
      'skip_vote': 'skip_vote',
      'tracks': {
        'add_to_playlist': 'add_to_playlist',
        'see_more_results': 'see_more_results',
        'cancel_search': 'cancel_search',
      },
      'artists': {
        'view_artist_tracks': 'view_artist_tracks',
        'see_more_artists': 'see_more_artists',
      },
    },
  },
};
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSlackApi = {
  post: jest.fn(),
};
const mockSlackFormatReply = {
  inChannelPost: jest.fn(),
};
const mockSlackFormatBlocks = {
  actionSection: jest.fn(),
  buttonActionElement: jest.fn(),
  confirmObject: jest.fn(),
  overflowActionElement: jest.fn(),
  overflowOption: jest.fn(),
  textSection: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});

jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackFormatBlocks, {virtual: true});
jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/control/control-open');
const response = mod.RESPONSE;
const buttons = mod.BUTTONS;

const {teamId, channelId} = require('../../../data/request');
const params = {
  0: {teamId, channelId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Settings Device Switch', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockSlackApi.post.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, null, response.failed);
    });
  });

  describe('main', () => {
    it('should successfully open control panel', async () => {
      const text = {section: true};
      const overflow = {option: true};
      const buttonAction = {action: true};
      const confirm = {confirm: true};
      const overflowAction = {action: true};
      const actionSection = {actionSection: true};
      const post = {inChannel: true};

      mockSlackFormatBlocks.textSection.mockReturnValue(text);
      mockSlackFormatBlocks.overflowOption.mockReturnValue(overflow);
      mockSlackFormatBlocks.buttonActionElement.mockReturnValue(buttonAction);
      mockSlackFormatBlocks.confirmObject.mockReturnValue(confirm);
      mockSlackFormatBlocks.overflowActionElement.mockReturnValue(overflowAction);
      mockSlackFormatBlocks.actionSection.mockReturnValue(actionSection);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSlackFormatBlocks.textSection).toHaveBeenCalledWith(response.info);
      expect(mockSlackFormatBlocks.overflowOption).nthCalledWith(1, buttons.reset, mockConfig.slack.actions.controls.reset);
      expect(mockSlackFormatBlocks.overflowOption).nthCalledWith(2, buttons.clear, mockConfig.slack.actions.controls.clear_one);
      expect(mockSlackFormatBlocks.overflowOption).nthCalledWith(3, buttons.jump, mockConfig.slack.actions.controls.jump_to_start);
      expect(mockSlackFormatBlocks.overflowOption).nthCalledWith(4, buttons.shuffle, mockConfig.slack.actions.controls.shuffle);
      expect(mockSlackFormatBlocks.overflowOption).nthCalledWith(5, buttons.repeat, mockConfig.slack.actions.controls.repeat);
      expect(mockSlackFormatBlocks.buttonActionElement).nthCalledWith(1, mockConfig.slack.actions.controls.play, buttons.play, mockConfig.slack.actions.controls.play);
      expect(mockSlackFormatBlocks.confirmObject).toHaveBeenCalledWith('Are you sure?', 'This will pause playback of Spotbot.', 'Do it', 'Cancel');
      expect(mockSlackFormatBlocks.buttonActionElement).nthCalledWith(2, mockConfig.slack.actions.controls.pause, buttons.pause, mockConfig.slack.actions.controls.pause, confirm);
      expect(mockSlackFormatBlocks.buttonActionElement).nthCalledWith(3, mockConfig.slack.actions.controls.skip, buttons.skip, mockConfig.slack.actions.controls.skip);
      expect(mockSlackFormatBlocks.confirmObject).toHaveBeenCalledWith('Are you sure?', 'Make sure everyone is okay with you doing this.', 'Do it', 'Cancel');
      expect(mockSlackFormatBlocks.overflowActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.controller_overflow, [overflow, overflow, overflow, overflow, overflow], confirm);
      expect(mockSlackFormatBlocks.actionSection).toHaveBeenCalledWith(mockConfig.slack.actions.controller, [buttonAction, buttonAction, buttonAction, overflowAction]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.info, [text, actionSection]);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });
  });
});
