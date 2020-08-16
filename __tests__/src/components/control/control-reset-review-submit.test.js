const mockConfig = {
  'slack': {
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
    'buttons': {
      'primary': 'primary',
      'danger': 'danger',
    },
  },
};
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSns = {
  publish: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});

jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/control/control-reset-review-submit');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId} = require('../../../data/request');
const view = {
  0: {
    'id': 'V018XLMQPDZ',
    'team_id': 'TRVUTD7DM',
    'type': 'modal',
    'blocks': [
      {
        'type': 'section',
        'block_id': 'mXY',
        'text': {
          'type': 'mrkdwn',
          'text': '*1* track was added in the past 30 minutes. Are you sure you want to remove it?  Closing this window will keep none.',
          'verbatim': false,
        },
      },
      {
        'type': 'input',
        'block_id': 'reset_modal',
        'label': {
          'type': 'plain_text',
          'text': 'Select songs to keep on the playlist',
          'emoji': true,
        },
        'hint': {
          'type': 'plain_text',
          'text': 'Tracks added in the past 10 minutes have been pre-selected.',
          'emoji': true,
        },
        'optional': true,
        'element': {
          'type': 'multi_static_select',
          'action_id': 'reset_modal',
          'initial_options': [
            {
              'text': {
                'type': 'plain_text',
                'text': 'Andrew Prahlow - Outer Wilds',
                'emoji': true,
              },
              'value': 'spotify:track:25lTenJPmSfwCRZi2hjCcB',
            },
          ],
          'option_groups': [
            {
              'label': {
                'type': 'plain_text',
                'text': 'Added less than 10 minutes ago',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Andrew Prahlow - Outer Wilds',
                    'emoji': true,
                  },
                  'value': 'spotify:track:25lTenJPmSfwCRZi2hjCcB',
                },
              ],
            },
          ],
        },
      },
      {
        'type': 'input',
        'block_id': 'reset_review_jump',
        'label': {
          'type': 'plain_text',
          'text': 'Jump to the start of the playlist?',
          'emoji': true,
        },
        'hint': {
          'type': 'plain_text',
          'text': 'This will only work if a track is selected above.',
          'emoji': true,
        },
        'optional': false,
        'element': {
          'type': 'static_select',
          'action_id': 'reset_review_jump',
          'initial_option': {
            'text': {
              'type': 'plain_text',
              'text': 'Yes',
              'emoji': true,
            },
            'value': 'true',
          },
          'options': [
            {
              'text': {
                'type': 'plain_text',
                'text': 'Yes',
                'emoji': true,
              },
              'value': 'true',
            },
            {
              'text': {
                'type': 'plain_text',
                'text': 'No',
                'emoji': true,
              },
              'value': 'false',
            },
          ],
        },
      },
    ],
    'private_metadata': 'CRU3H4MEC',
    'callback_id': 'reset_modal',
    'state': {
      'values': {
        'reset_modal': {
          'reset_modal': {
            'type': 'multi_static_select',
            'selected_options': [
              {
                'text': {
                  'type': 'plain_text',
                  'text': 'Andrew Prahlow - Outer Wilds',
                  'emoji': true,
                },
                'value': 'spotify:track:25lTenJPmSfwCRZi2hjCcB',
              },
            ],
          },
        },
        'reset_review_jump': {
          'reset_review_jump': {
            'type': 'static_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'Yes',
                'emoji': true,
              },
              'value': 'true',
            },
          },
        },
      },
    },
    'hash': '1597551436.YKcbKtiV',
    'title': {
      'type': 'plain_text',
      'text': 'Reset: Review Tracks',
      'emoji': true,
    },
    'clear_on_close': false,
    'notify_on_close': true,
    'close': {
      'type': 'plain_text',
      'text': 'Close',
      'emoji': true,
    },
    'submit': {
      'type': 'plain_text',
      'text': 'Confirm',
      'emoji': true,
    },
    'previous_view_id': null,
    'root_view_id': 'V018XLMQPDZ',
    'app_id': 'A012EC4351T',
    'external_id': '',
    'app_installed_team_id': 'TRVUTD7DM',
    'bot_id': 'B012FPR625Q',
  },
  1: {
    'id': 'V019A3KSPQ9',
    'team_id': 'TRVUTD7DM',
    'type': 'modal',
    'blocks': [
      {
        'type': 'section',
        'block_id': 'Tgt',
        'text': {
          'type': 'mrkdwn',
          'text': '*1* track was added in the past 30 minutes. Are you sure you want to remove it?  Closing this window will keep none.',
          'verbatim': false,
        },
      },
      {
        'type': 'input',
        'block_id': 'reset_modal',
        'label': {
          'type': 'plain_text',
          'text': 'Select songs to keep on the playlist',
          'emoji': true,
        },
        'hint': {
          'type': 'plain_text',
          'text': 'Tracks added in the past 10 minutes have been pre-selected.',
          'emoji': true,
        },
        'optional': true,
        'element': {
          'type': 'multi_static_select',
          'action_id': 'reset_modal',
          'initial_options': [
            {
              'text': {
                'type': 'plain_text',
                'text': 'Andrew Prahlow - Outer Wilds',
                'emoji': true,
              },
              'value': 'spotify:track:25lTenJPmSfwCRZi2hjCcB',
            },
          ],
          'option_groups': [
            {
              'label': {
                'type': 'plain_text',
                'text': 'Added less than 10 minutes ago',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Andrew Prahlow - Outer Wilds',
                    'emoji': true,
                  },
                  'value': 'spotify:track:25lTenJPmSfwCRZi2hjCcB',
                },
              ],
            },
          ],
        },
      },
      {
        'type': 'input',
        'block_id': 'reset_review_jump',
        'label': {
          'type': 'plain_text',
          'text': 'Jump to the start of the playlist?',
          'emoji': true,
        },
        'hint': {
          'type': 'plain_text',
          'text': 'This will only work if a track is selected above.',
          'emoji': true,
        },
        'optional': false,
        'element': {
          'type': 'static_select',
          'action_id': 'reset_review_jump',
          'initial_option': {
            'text': {
              'type': 'plain_text',
              'text': 'Yes',
              'emoji': true,
            },
            'value': 'true',
          },
          'options': [
            {
              'text': {
                'type': 'plain_text',
                'text': 'Yes',
                'emoji': true,
              },
              'value': 'true',
            },
            {
              'text': {
                'type': 'plain_text',
                'text': 'No',
                'emoji': true,
              },
              'value': 'false',
            },
          ],
        },
      },
    ],
    'private_metadata': 'CRU3H4MEC',
    'callback_id': 'reset_modal',
    'state': {
      'values': {
        'reset_modal': {
          'reset_modal': {
            'type': 'multi_static_select',
          },
        },
        'reset_review_jump': {
          'reset_review_jump': {
            'type': 'static_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'Yes',
                'emoji': true,
              },
              'value': 'true',
            },
          },
        },
      },
    },
    'hash': '1597551506.lVtaQl8y',
    'title': {
      'type': 'plain_text',
      'text': 'Reset: Review Tracks',
      'emoji': true,
    },
    'clear_on_close': false,
    'notify_on_close': true,
    'close': {
      'type': 'plain_text',
      'text': 'Close',
      'emoji': true,
    },
    'submit': {
      'type': 'plain_text',
      'text': 'Confirm',
      'emoji': true,
    },
    'previous_view_id': null,
    'root_view_id': 'V019A3KSPQ9',
    'app_id': 'A012EC4351T',
    'external_id': '',
    'app_installed_team_id': 'TRVUTD7DM',
    'bot_id': 'B012FPR625Q',
  }};
const params = {
  0: {teamId, channelId, settings, view: view[0], userId},
  1: {teamId, channelId, settings, view: view[1], userId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Control Reset Review Submit', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockSns.promise.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, null, response.failed);
    });
  });
  describe('main', () => {
    it('should extract submissions and send it to control reset set', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings, trackUris: [view[0].state.values.reset_modal.reset_modal.selected_options[0].value], userId, jump: true}),
        TopicArn: process.env.SNS_PREFIX + 'control-reset-set',
      });
    });

    it('should extract no submissions and send it to control reset set', async () => {
      await expect(mod.handler(event(params[1]))).resolves.toBe();
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings, userId, jump: true}),
        TopicArn: process.env.SNS_PREFIX + 'control-reset-set',
      });
    });
  });
});
