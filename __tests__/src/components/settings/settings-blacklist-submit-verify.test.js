/* eslint-disable require-jsdoc */
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
        'play_close': 'play_close',
        'play_track': 'play_track',
        'pause': 'pause',
        'skip': 'skip',
        'reset': 'reset',
        'clear_one': 'clear_one',
        'jump_to_start': 'jump_to_start',
        'jump_to_start_close': 'jump_to_start_close',
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
  'dynamodb': {
    'blacklist': {
      'limit': 80,
    },
  },
};
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSns = {
  publish: jest.fn(),
  promise: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});

jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const {teamId, channelId, settings, userId} = require('../../../data/request');

const mod = require('../../../../src/components/settings/settings-blacklist-submit-verify');
const response = mod.RESPONSE;

const view = {
  0: {
    'id': 'V018VRD56DV',
    'team_id': 'TRVUTD7DM',
    'type': 'modal',
    'blocks': [
      {
        'type': 'input',
        'block_id': 'blacklist_modal',
        'label': {
          'type': 'plain_text',
          'text': 'Blacklisted Tracks',
          'emoji': true,
        },
        'hint': {
          'type': 'plain_text',
          'text': 'Songs which are blacklisted cannot be added through Spotbot. They can also be skipped instantly. Max tracks: 80',
          'emoji': true,
        },
        'optional': true,
        'element': {
          'type': 'multi_static_select',
          'action_id': 'blacklist_modal',
          'initial_options': [
            {
              'text': {
                'type': 'plain_text',
                'text': 'Ed Sheeran - Thinking out Loud',
                'emoji': true,
              },
              'value': '34gCuhDGsG4bRPIf9bb02f',
            },
          ],
          'option_groups': [
            {
              'label': {
                'type': 'plain_text',
                'text': 'Skipped Recently:',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Sam Allen - Barricade',
                    'emoji': true,
                  },
                  'value': '6jVy9OEtu7VJyPrrHG25jb',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Ed Sheeran - Thinking out Loud',
                    'emoji': true,
                  },
                  'value': '34gCuhDGsG4bRPIf9bb02f',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'San Cisco - When I Dream',
                    'emoji': true,
                  },
                  'value': '579j0QRchEajNo11kaaAUx',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'San Cisco - On The Line',
                    'emoji': true,
                  },
                  'value': '4ztnd2IahPRr3wk9FPwiGV',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'E^ST - TALK DEEP',
                    'emoji': true,
                  },
                  'value': '6RMvf7OCYYSw4x2K8UakDt',
                },
              ],
            },
            {
              'label': {
                'type': 'plain_text',
                'text': 'Recently played:',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Lime Cordiale - Inappropriate Behaviour',
                    'emoji': true,
                  },
                  'value': '5ev47QYsBU46zhjnHC3Jmh',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'The Jungle Giants - Heavy Hearted',
                    'emoji': true,
                  },
                  'value': '3yXgttblOo006gd4eGOvw1',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'DMA\'S - Believe (triple j Like A Version) - Cover Version',
                    'emoji': true,
                  },
                  'value': '6akrLfeUZ4WZoQ7SSnOONX',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Holy Holy - True Lovers',
                    'emoji': true,
                  },
                  'value': '5RHY7WkAjAhpxuPN0CTd4F',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Bugs - Charlie - triple j Like A Version',
                    'emoji': true,
                  },
                  'value': '4l7yogg2XCRrmkK7BPvVq4',
                },
              ],
            },
            {
              'label': {
                'type': 'plain_text',
                'text': 'Currently on the blacklist:',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Ed Sheeran - Thinking out Loud',
                    'emoji': true,
                  },
                  'value': '34gCuhDGsG4bRPIf9bb02f',
                },
              ],
            },
          ],
        },
      },
    ],
    'private_metadata': 'CRU3H4MEC',
    'callback_id': 'blacklist_modal',
    'state': {
      'values': {
        'blacklist_modal': {
          'blacklist_modal': {
            'type': 'multi_static_select',
            'selected_options': [
              {
                'text': {
                  'type': 'plain_text',
                  'text': 'Ed Sheeran - Thinking out Loud',
                  'emoji': true,
                },
                'value': '34gCuhDGsG4bRPIf9bb02f',
              },
              {
                'text': {
                  'type': 'plain_text',
                  'text': 'San Cisco - When I Dream',
                  'emoji': true,
                },
                'value': '579j0QRchEajNo11kaaAUx',
              },
            ],
          },
        },
      },
    },
    'hash': '1598059066.W9oUjpMG',
    'title': {
      'type': 'plain_text',
      'text': 'Spotbot Blacklist',
      'emoji': true,
    },
    'clear_on_close': false,
    'notify_on_close': false,
    'close': {
      'type': 'plain_text',
      'text': 'Close',
      'emoji': true,
    },
    'submit': {
      'type': 'plain_text',
      'text': 'Save',
      'emoji': true,
    },
    'previous_view_id': null,
    'root_view_id': 'V018VRD56DV',
    'app_id': 'A012EC4351T',
    'external_id': '',
    'app_installed_team_id': 'TRVUTD7DM',
    'bot_id': 'B012FPR625Q',
  },
  1: {
    'id': 'V018VRD56DV',
    'team_id': 'TRVUTD7DM',
    'type': 'modal',
    'blocks': [
      {
        'type': 'input',
        'block_id': 'blacklist_modal',
        'label': {
          'type': 'plain_text',
          'text': 'Blacklisted Tracks',
          'emoji': true,
        },
        'hint': {
          'type': 'plain_text',
          'text': 'Songs which are blacklisted cannot be added through Spotbot. They can also be skipped instantly. Max tracks: 80',
          'emoji': true,
        },
        'optional': true,
        'element': {
          'type': 'multi_static_select',
          'action_id': 'blacklist_modal',
          'initial_options': [
            {
              'text': {
                'type': 'plain_text',
                'text': 'Ed Sheeran - Thinking out Loud',
                'emoji': true,
              },
              'value': '34gCuhDGsG4bRPIf9bb02f',
            },
          ],
          'option_groups': [
            {
              'label': {
                'type': 'plain_text',
                'text': 'Skipped Recently:',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Sam Allen - Barricade',
                    'emoji': true,
                  },
                  'value': '6jVy9OEtu7VJyPrrHG25jb',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Ed Sheeran - Thinking out Loud',
                    'emoji': true,
                  },
                  'value': '34gCuhDGsG4bRPIf9bb02f',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'San Cisco - When I Dream',
                    'emoji': true,
                  },
                  'value': '579j0QRchEajNo11kaaAUx',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'San Cisco - On The Line',
                    'emoji': true,
                  },
                  'value': '4ztnd2IahPRr3wk9FPwiGV',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'E^ST - TALK DEEP',
                    'emoji': true,
                  },
                  'value': '6RMvf7OCYYSw4x2K8UakDt',
                },
              ],
            },
            {
              'label': {
                'type': 'plain_text',
                'text': 'Recently played:',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Lime Cordiale - Inappropriate Behaviour',
                    'emoji': true,
                  },
                  'value': '5ev47QYsBU46zhjnHC3Jmh',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'The Jungle Giants - Heavy Hearted',
                    'emoji': true,
                  },
                  'value': '3yXgttblOo006gd4eGOvw1',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'DMA\'S - Believe (triple j Like A Version) - Cover Version',
                    'emoji': true,
                  },
                  'value': '6akrLfeUZ4WZoQ7SSnOONX',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Holy Holy - True Lovers',
                    'emoji': true,
                  },
                  'value': '5RHY7WkAjAhpxuPN0CTd4F',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Bugs - Charlie - triple j Like A Version',
                    'emoji': true,
                  },
                  'value': '4l7yogg2XCRrmkK7BPvVq4',
                },
              ],
            },
            {
              'label': {
                'type': 'plain_text',
                'text': 'Currently on the blacklist:',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Ed Sheeran - Thinking out Loud',
                    'emoji': true,
                  },
                  'value': '34gCuhDGsG4bRPIf9bb02f',
                },
              ],
            },
          ],
        },
      },
    ],
    'private_metadata': 'CRU3H4MEC',
    'callback_id': 'blacklist_modal',
    'state': {
      'values': {
        'blacklist_modal': {
          'blacklist_modal': {
            'type': 'multi_static_select',
            'selected_options': new Array(100).fill().map(() => 'test'),
          },
        },
      },
    },
    'hash': '1598059066.W9oUjpMG',
    'title': {
      'type': 'plain_text',
      'text': 'Spotbot Blacklist',
      'emoji': true,
    },
    'clear_on_close': false,
    'notify_on_close': false,
    'close': {
      'type': 'plain_text',
      'text': 'Close',
      'emoji': true,
    },
    'submit': {
      'type': 'plain_text',
      'text': 'Save',
      'emoji': true,
    },
    'previous_view_id': null,
    'root_view_id': 'V018VRD56DV',
    'app_id': 'A012EC4351T',
    'external_id': '',
    'app_installed_team_id': 'TRVUTD7DM',
    'bot_id': 'B012FPR625Q',
  },
  2: {
    'id': 'V018VRD56DV',
    'team_id': 'TRVUTD7DM',
    'type': 'modal',
    'blocks': [
      {
        'type': 'input',
        'block_id': 'blacklist_modal',
        'label': {
          'type': 'plain_text',
          'text': 'Blacklisted Tracks',
          'emoji': true,
        },
        'hint': {
          'type': 'plain_text',
          'text': 'Songs which are blacklisted cannot be added through Spotbot. They can also be skipped instantly. Max tracks: 80',
          'emoji': true,
        },
        'optional': true,
        'element': {
          'type': 'multi_static_select',
          'action_id': 'blacklist_modal',
          'initial_options': [
            {
              'text': {
                'type': 'plain_text',
                'text': 'Ed Sheeran - Thinking out Loud',
                'emoji': true,
              },
              'value': '34gCuhDGsG4bRPIf9bb02f',
            },
          ],
          'option_groups': [
            {
              'label': {
                'type': 'plain_text',
                'text': 'Skipped Recently:',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Sam Allen - Barricade',
                    'emoji': true,
                  },
                  'value': '6jVy9OEtu7VJyPrrHG25jb',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Ed Sheeran - Thinking out Loud',
                    'emoji': true,
                  },
                  'value': '34gCuhDGsG4bRPIf9bb02f',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'San Cisco - When I Dream',
                    'emoji': true,
                  },
                  'value': '579j0QRchEajNo11kaaAUx',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'San Cisco - On The Line',
                    'emoji': true,
                  },
                  'value': '4ztnd2IahPRr3wk9FPwiGV',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'E^ST - TALK DEEP',
                    'emoji': true,
                  },
                  'value': '6RMvf7OCYYSw4x2K8UakDt',
                },
              ],
            },
            {
              'label': {
                'type': 'plain_text',
                'text': 'Recently played:',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Lime Cordiale - Inappropriate Behaviour',
                    'emoji': true,
                  },
                  'value': '5ev47QYsBU46zhjnHC3Jmh',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'The Jungle Giants - Heavy Hearted',
                    'emoji': true,
                  },
                  'value': '3yXgttblOo006gd4eGOvw1',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'DMA\'S - Believe (triple j Like A Version) - Cover Version',
                    'emoji': true,
                  },
                  'value': '6akrLfeUZ4WZoQ7SSnOONX',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Holy Holy - True Lovers',
                    'emoji': true,
                  },
                  'value': '5RHY7WkAjAhpxuPN0CTd4F',
                },
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Bugs - Charlie - triple j Like A Version',
                    'emoji': true,
                  },
                  'value': '4l7yogg2XCRrmkK7BPvVq4',
                },
              ],
            },
            {
              'label': {
                'type': 'plain_text',
                'text': 'Currently on the blacklist:',
                'emoji': true,
              },
              'options': [
                {
                  'text': {
                    'type': 'plain_text',
                    'text': 'Ed Sheeran - Thinking out Loud',
                    'emoji': true,
                  },
                  'value': '34gCuhDGsG4bRPIf9bb02f',
                },
              ],
            },
          ],
        },
      },
    ],
    'private_metadata': 'CRU3H4MEC',
    'callback_id': 'blacklist_modal',
    'state': {
      'values': {
        'blacklist_modal': {
          'blacklist_modal': {
            'type': 'multi_static_select',
          },
        },
      },
    },
    'hash': '1598059066.W9oUjpMG',
    'title': {
      'type': 'plain_text',
      'text': 'Spotbot Blacklist',
      'emoji': true,
    },
    'clear_on_close': false,
    'notify_on_close': false,
    'close': {
      'type': 'plain_text',
      'text': 'Close',
      'emoji': true,
    },
    'submit': {
      'type': 'plain_text',
      'text': 'Save',
      'emoji': true,
    },
    'previous_view_id': null,
    'root_view_id': 'V018VRD56DV',
    'app_id': 'A012EC4351T',
    'external_id': '',
    'app_installed_team_id': 'TRVUTD7DM',
    'bot_id': 'B012FPR625Q',
  },
};

const params = {
  0: {teamId, channelId, settings, userId, view: view[0]},
  1: {teamId, channelId, settings, userId, view: view[1]}, // Too many tracks
  2: {teamId, channelId, settings, userId, view: view[2]}, // Empty submission
};


describe('Settings Blacklist Submission Verfification', () => {
  beforeEach(() => {
    mockSns.publish.mockReturnThis();
  });
  describe('handler', () => {
    const event = params[0];
    describe('success', () => {
      it('should call the main function', async () => {
        expect.assertions(1);
        await expect(mod.handler(event)).resolves.toBe(null);
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mockSns.promise.mockRejectedValue(error);

        await expect(mod.handler(event)).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should successfully validate and call blacklist submit save', async () => {
      const event = params[0];
      const submissions = view[0].state.values.blacklist_modal.blacklist_modal.selected_options;
      await expect(mod.handler(event)).resolves.toBe(null);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings, userId, submissions}),
        TopicArn: process.env.SNS_PREFIX + 'settings-blacklist-submit-save',
      });
    });

    it('should successfully validate and call blacklist submit save with an empty submission list', async () => {
      const event = params[2];
      await expect(mod.handler(event)).resolves.toBe(null);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings, userId, submissions: []}),
        TopicArn: process.env.SNS_PREFIX + 'settings-blacklist-submit-save',
      });
    });

    it('should report that there are too many tracks', async () => {
      const event = params[1];
      await expect(mod.handler(event)).resolves.toStrictEqual({
        response_action: 'errors',
        errors: {[mockConfig.slack.actions.blacklist_modal]: response.too_many_tracks},
      });
    });
  });
});
