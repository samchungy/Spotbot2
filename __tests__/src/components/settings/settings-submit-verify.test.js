/* eslint-disable require-jsdoc */
const mockConfig = {
  'dynamodb': {
    'settings': {
      'channel_admins': 'channel_admins',
      'playlist': 'playlist',
      'default_device': 'default_device',
      'disable_repeats_duration': 'disable_repeats_duration',
      'back_to_playlist': 'back_to_playlist',
      'skip_votes': 'skip_votes',
      'skip_votes_ah': 'skip_votes_ah',
      'timezone': 'timezone',
      'ghost_mode': 'ghost_mode',
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
const mockUtilObjects = {
  isEmpty: jest.fn(),
  isPositiveInteger: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});

jest.mock('/opt/utils/util-objects', () => mockUtilObjects, {virtual: true});

jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/settings/settings-submit-verify');
const response = mod.RESPONSE;
const settingsSubmitSave = mod.SETTINGS_SUBMIT_SAVE;

const {teamId, channelId, userId} = require('../../../data/request');
const view = {
  0: {
    'id': 'V018U14N7CG',
    'team_id': 'TRVUTD7DM',
    'type': 'modal',
    'blocks': [{
      'type': 'section',
      'block_id': 'reauth',
      'text': {
        'type': 'mrkdwn',
        'text': 'Click to re-authenticate with Spotify.',
        'verbatim': false,
      },
      'accessory': {
        'type': 'button',
        'action_id': 'reauth',
        'text': {
          'type': 'plain_text',
          'text': ':gear: Reset Spotify Authentication',
          'emoji': true,
        },
        'value': 'reauth',
        'confirm': {
          'title': {
            'type': 'plain_text',
            'text': 'Are you sure?',
            'emoji': true,
          },
          'text': {
            'type': 'mrkdwn',
            'text': 'This will disable this channel\'s Spotbot functionality until Spotbot is re-authenticated.',
            'verbatim': false,
          },
          'confirm': {
            'type': 'plain_text',
            'text': 'Reset Authentication',
            'emoji': true,
          },
          'deny': {
            'type': 'plain_text',
            'text': 'Cancel',
            'emoji': true,
          },
        },
      },
    },
    {
      'type': 'context',
      'block_id': 'auth_confirmation',
      'elements': [{
        'type': 'mrkdwn',
        'text': ':white_check_mark: Authenticated with Sam Chung - Spotify Premium',
        'verbatim': false,
      }],
    },
    {
      'type': 'input',
      'block_id': 'channel_admins',
      'label': {
        'type': 'plain_text',
        'text': 'Channel Admins',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'Admins can use Spotbot admin commands within this channel and modify it\'s settings.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'multi_users_select',
        'action_id': 'channel_admins',
        'initial_users': [
          'URVUTD7UP',
        ],
      },
    },
    {
      'type': 'input',
      'block_id': 'playlist',
      'label': {
        'type': 'plain_text',
        'text': 'Spotbot Playlist',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'external_select',
        'action_id': 'playlist',
        'initial_option': {
          'text': {
            'type': 'plain_text',
            'text': 'New Playlist',
            'emoji': true,
          },
          'value': '0IEMBuGAQ3vyNa4aiT3mD8',
        },
        'placeholder': {
          'type': 'plain_text',
          'text': 'Type a playlist name',
          'emoji': true,
        },
        'min_query_length': 3,
      },
    },
    {
      'type': 'input',
      'block_id': 'default_device',
      'label': {
        'type': 'plain_text',
        'text': 'Default Spotify Device',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'This helps Spotbot with playing. Turn on your Spotify device now.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'external_select',
        'action_id': 'default_device',
        'initial_option': {
          'text': {
            'type': 'plain_text',
            'text': 'DESKTOP-I7U2161 - Computer',
            'emoji': true,
          },
          'value': '49433c0b9868f755ee05b5a58908f31c8d28faaf',
        },
        'placeholder': {
          'type': 'plain_text',
          'text': 'Pick an option',
          'emoji': true,
        },
        'min_query_length': 0,
      },
    },
    {
      'type': 'input',
      'block_id': 'disable_repeats_duration',
      'label': {
        'type': 'plain_text',
        'text': 'Disable Repeats Duration (Hours)',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'plain_text_input',
        'action_id': 'disable_repeats_duration',
        'placeholder': {
          'type': 'plain_text',
          'text': 'Enter a number eg. 4',
          'emoji': true,
        },
        'initial_value': '3',
        'max_length': 5,
      },
    },
    {
      'type': 'input',
      'block_id': 'back_to_playlist',
      'label': {
        'type': 'plain_text',
        'text': 'Jump Back to Playlist',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'static_select',
        'action_id': 'back_to_playlist',
        'initial_option': {
          'text': {
            'type': 'plain_text',
            'text': 'Yes',
            'emoji': true,
          },
          'value': 'true',
        },
        'options': [{
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
    {
      'type': 'input',
      'block_id': 'ghost_mode',
      'label': {
        'type': 'plain_text',
        'text': 'Ghost Mode',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'Disables slash command usage visibility in the channel for track related commands. /whom can still be used to find who added a track.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'static_select',
        'action_id': 'ghost_mode',
        'initial_option': {
          'text': {
            'type': 'plain_text',
            'text': 'No',
            'emoji': true,
          },
          'value': 'false',
        },
        'options': [{
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
    {
      'type': 'input',
      'block_id': 'timezone',
      'label': {
        'type': 'plain_text',
        'text': 'Timezone',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'This is to configure the time based skip votes. Type in a location.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'external_select',
        'action_id': 'timezone',
        'initial_option': {
          'text': {
            'type': 'plain_text',
            'text': 'Australia/Melbourne (+10:00)',
            'emoji': true,
          },
          'value': 'Australia/Melbourne',
        },
        'placeholder': {
          'type': 'plain_text',
          'text': 'Type to find your timezone',
          'emoji': true,
        },
        'min_query_length': 3,
      },
    },
    {
      'type': 'input',
      'block_id': 'skip_votes',
      'label': {
        'type': 'plain_text',
        'text': 'Skip Votes',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'The number of additional votes needed to skip a song. Integers only',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'plain_text_input',
        'action_id': 'skip_votes',
        'placeholder': {
          'type': 'plain_text',
          'text': 'Enter a number eg. 2',
          'emoji': true,
        },
        'initial_value': '2',
        'max_length': 2,
      },
    },
    {
      'type': 'input',
      'block_id': 'skip_votes_ah',
      'label': {
        'type': 'plain_text',
        'text': 'Skip Votes - After Hours (6pm-6am)',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'The number of additional votes needed to skip a song. Integers only',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'plain_text_input',
        'action_id': 'skip_votes_ah',
        'placeholder': {
          'type': 'plain_text',
          'text': 'Enter a number eg. 0',
          'emoji': true,
        },
        'initial_value': '2',
        'max_length': 2,
      },
    },
    ],
    'private_metadata': 'CRU3H4MEC',
    'callback_id': 'settings_modal',
    'state': {
      'values': {
        'channel_admins': {
          'channel_admins': {
            'type': 'multi_users_select',
            'selected_users': [
              'URVUTD7UP',
            ],
          },
        },
        'playlist': {
          'playlist': {
            'type': 'external_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'New Playlist',
                'emoji': true,
              },
              'value': '0IEMBuGAQ3vyNa4aiT3mD8',
            },
          },
        },
        'default_device': {
          'default_device': {
            'type': 'external_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'DESKTOP-I7U2161 - Computer',
                'emoji': true,
              },
              'value': '49433c0b9868f755ee05b5a58908f31c8d28faaf',
            },
          },
        },
        'disable_repeats_duration': {
          'disable_repeats_duration': {
            'type': 'plain_text_input',
            'value': '3',
          },
        },
        'back_to_playlist': {
          'back_to_playlist': {
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
        'ghost_mode': {
          'ghost_mode': {
            'type': 'static_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'No',
                'emoji': true,
              },
              'value': 'false',
            },
          },
        },
        'timezone': {
          'timezone': {
            'type': 'external_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'Australia/Melbourne (+10:00)',
                'emoji': true,
              },
              'value': 'Australia/Melbourne',
            },
          },
        },
        'skip_votes': {
          'skip_votes': {
            'type': 'plain_text_input',
            'value': '2',
          },
        },
        'skip_votes_ah': {
          'skip_votes_ah': {
            'type': 'plain_text_input',
            'value': '2',
          },
        },
      },
    },
    'hash': '1596286221.gMNpWzOE',
    'title': {
      'type': 'plain_text',
      'text': 'Spotbot Settings',
      'emoji': true,
    },
    'clear_on_close': false,
    'notify_on_close': false,
    'close': {
      'type': 'plain_text',
      'text': 'Cancel',
      'emoji': true,
    },
    'submit': {
      'type': 'plain_text',
      'text': 'Save',
      'emoji': true,
    },
    'previous_view_id': null,
    'root_view_id': 'V018U14N7CG',
    'app_id': 'A012EC4351T',
    'external_id': '',
    'app_installed_team_id': 'TRVUTD7DM',
    'bot_id': 'B012FPR625Q',
  },
  1: {
    'id': 'V018U14N7CG',
    'team_id': 'TRVUTD7DM',
    'type': 'modal',
    'blocks': [{
      'type': 'section',
      'block_id': 'reauth',
      'text': {
        'type': 'mrkdwn',
        'text': 'Click to re-authenticate with Spotify.',
        'verbatim': false,
      },
      'accessory': {
        'type': 'button',
        'action_id': 'reauth',
        'text': {
          'type': 'plain_text',
          'text': ':gear: Reset Spotify Authentication',
          'emoji': true,
        },
        'value': 'reauth',
        'confirm': {
          'title': {
            'type': 'plain_text',
            'text': 'Are you sure?',
            'emoji': true,
          },
          'text': {
            'type': 'mrkdwn',
            'text': 'This will disable this channel\'s Spotbot functionality until Spotbot is re-authenticated.',
            'verbatim': false,
          },
          'confirm': {
            'type': 'plain_text',
            'text': 'Reset Authentication',
            'emoji': true,
          },
          'deny': {
            'type': 'plain_text',
            'text': 'Cancel',
            'emoji': true,
          },
        },
      },
    },
    {
      'type': 'context',
      'block_id': 'auth_confirmation',
      'elements': [{
        'type': 'mrkdwn',
        'text': ':white_check_mark: Authenticated with Sam Chung - Spotify Premium',
        'verbatim': false,
      }],
    },
    {
      'type': 'input',
      'block_id': 'channel_admins',
      'label': {
        'type': 'plain_text',
        'text': 'Channel Admins',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'Admins can use Spotbot admin commands within this channel and modify it\'s settings.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'multi_users_select',
        'action_id': 'channel_admins',
        'initial_users': [
          'URVUTD7UP',
        ],
      },
    },
    {
      'type': 'input',
      'block_id': 'playlist',
      'label': {
        'type': 'plain_text',
        'text': 'Spotbot Playlist',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'external_select',
        'action_id': 'playlist',
        'initial_option': {
          'text': {
            'type': 'plain_text',
            'text': 'New Playlist',
            'emoji': true,
          },
          'value': '0IEMBuGAQ3vyNa4aiT3mD8',
        },
        'placeholder': {
          'type': 'plain_text',
          'text': 'Type a playlist name',
          'emoji': true,
        },
        'min_query_length': 3,
      },
    },
    {
      'type': 'input',
      'block_id': 'default_device',
      'label': {
        'type': 'plain_text',
        'text': 'Default Spotify Device',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'This helps Spotbot with playing. Turn on your Spotify device now.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'external_select',
        'action_id': 'default_device',
        'initial_option': {
          'text': {
            'type': 'plain_text',
            'text': 'DESKTOP-I7U2161 - Computer',
            'emoji': true,
          },
          'value': '49433c0b9868f755ee05b5a58908f31c8d28faaf',
        },
        'placeholder': {
          'type': 'plain_text',
          'text': 'Pick an option',
          'emoji': true,
        },
        'min_query_length': 0,
      },
    },
    {
      'type': 'input',
      'block_id': 'disable_repeats_duration',
      'label': {
        'type': 'plain_text',
        'text': 'Disable Repeats Duration (Hours)',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'plain_text_input',
        'action_id': 'disable_repeats_duration',
        'placeholder': {
          'type': 'plain_text',
          'text': 'Enter a number eg. 4',
          'emoji': true,
        },
        'initial_value': '3',
        'max_length': 5,
      },
    },
    {
      'type': 'input',
      'block_id': 'back_to_playlist',
      'label': {
        'type': 'plain_text',
        'text': 'Jump Back to Playlist',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'static_select',
        'action_id': 'back_to_playlist',
        'initial_option': {
          'text': {
            'type': 'plain_text',
            'text': 'Yes',
            'emoji': true,
          },
          'value': 'true',
        },
        'options': [{
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
    {
      'type': 'input',
      'block_id': 'ghost_mode',
      'label': {
        'type': 'plain_text',
        'text': 'Ghost Mode',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'Disables slash command usage visibility in the channel for track related commands. /whom can still be used to find who added a track.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'static_select',
        'action_id': 'ghost_mode',
        'initial_option': {
          'text': {
            'type': 'plain_text',
            'text': 'No',
            'emoji': true,
          },
          'value': 'false',
        },
        'options': [{
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
    {
      'type': 'input',
      'block_id': 'timezone',
      'label': {
        'type': 'plain_text',
        'text': 'Timezone',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'This is to configure the time based skip votes. Type in a location.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'external_select',
        'action_id': 'timezone',
        'initial_option': {
          'text': {
            'type': 'plain_text',
            'text': 'Australia/Melbourne (+10:00)',
            'emoji': true,
          },
          'value': 'Australia/Melbourne',
        },
        'placeholder': {
          'type': 'plain_text',
          'text': 'Type to find your timezone',
          'emoji': true,
        },
        'min_query_length': 3,
      },
    },
    {
      'type': 'input',
      'block_id': 'skip_votes',
      'label': {
        'type': 'plain_text',
        'text': 'Skip Votes',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'The number of additional votes needed to skip a song. Integers only',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'plain_text_input',
        'action_id': 'skip_votes',
        'placeholder': {
          'type': 'plain_text',
          'text': 'Enter a number eg. 2',
          'emoji': true,
        },
        'initial_value': '2',
        'max_length': 2,
      },
    },
    {
      'type': 'input',
      'block_id': 'skip_votes_ah',
      'label': {
        'type': 'plain_text',
        'text': 'Skip Votes - After Hours (6pm-6am)',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'The number of additional votes needed to skip a song. Integers only',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'plain_text_input',
        'action_id': 'skip_votes_ah',
        'placeholder': {
          'type': 'plain_text',
          'text': 'Enter a number eg. 0',
          'emoji': true,
        },
        'initial_value': '2',
        'max_length': 2,
      },
    },
    ],
    'private_metadata': 'CRU3H4MEC',
    'callback_id': 'settings_modal',
    'state': {
      'values': {
        'channel_admins': {
          'channel_admins': {
            'type': 'multi_users_select',
            'selected_users': [
              'URVUTD7UP',
            ],
          },
        },
        'playlist': {
          'playlist': {
            'type': 'external_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'New Playlist',
                'emoji': true,
              },
              'value': '0IEMBuGAQ3vyNa4aiT3mD8',
            },
          },
        },
        'default_device': {
          'default_device': {
            'type': 'external_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'DESKTOP-I7U2161 - Computer',
                'emoji': true,
              },
              'value': '49433c0b9868f755ee05b5a58908f31c8d28faaf',
            },
          },
        },
        'disable_repeats_duration': {
          'disable_repeats_duration': {
            'type': 'plain_text_input',
            'value': 'bad',
          },
        },
        'back_to_playlist': {
          'back_to_playlist': {
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
        'ghost_mode': {
          'ghost_mode': {
            'type': 'static_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'No',
                'emoji': true,
              },
              'value': 'false',
            },
          },
        },
        'timezone': {
          'timezone': {
            'type': 'external_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'Australia/Melbourne (+10:00)',
                'emoji': true,
              },
              'value': 'Australia/Melbourne',
            },
          },
        },
        'skip_votes': {
          'skip_votes': {
            'type': 'plain_text_input',
            'value': '2',
          },
        },
        'skip_votes_ah': {
          'skip_votes_ah': {
            'type': 'plain_text_input',
            'value': '2',
          },
        },
      },
    },
    'hash': '1596286221.gMNpWzOE',
    'title': {
      'type': 'plain_text',
      'text': 'Spotbot Settings',
      'emoji': true,
    },
    'clear_on_close': false,
    'notify_on_close': false,
    'close': {
      'type': 'plain_text',
      'text': 'Cancel',
      'emoji': true,
    },
    'submit': {
      'type': 'plain_text',
      'text': 'Save',
      'emoji': true,
    },
    'previous_view_id': null,
    'root_view_id': 'V018U14N7CG',
    'app_id': 'A012EC4351T',
    'external_id': '',
    'app_installed_team_id': 'TRVUTD7DM',
    'bot_id': 'B012FPR625Q',
  },
};
const params = {
  0: {teamId, channelId, view: view[0], userId},
  1: {teamId, channelId, view: view[1], userId},
};

describe('Settings submission verfification', () => {
  beforeEach(() => {
    mockSns.publish.mockReturnThis();
  });
  describe('handler', () => {
    const event = params[0];
    describe('success', () => {
      it('should call the main function', async () => {
        mockUtilObjects.isEmpty.mockReturnValue(true);
        expect.assertions(1);
        await expect(mod.handler(event)).resolves.toBe(null);
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mockSns.promise.mockRejectedValue(error);
        mockUtilObjects.isEmpty.mockReturnValue(true);

        expect.assertions(3);
        await expect(mod.handler(event)).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should extract submissions and call to save settings', async () => {
      const event = params[0];
      const submissions = {
        'channel_admins': [
          'URVUTD7UP',
        ],
        'playlist': '0IEMBuGAQ3vyNa4aiT3mD8',
        'default_device': '49433c0b9868f755ee05b5a58908f31c8d28faaf',
        'disable_repeats_duration': '3',
        'back_to_playlist': 'true',
        'ghost_mode': 'false',
        'timezone': 'Australia/Melbourne',
        'skip_votes': '2',
        'skip_votes_ah': '2',
      };
      const sns = {
        Message: JSON.stringify({teamId, channelId, userId, submissions}),
        TopicArn: settingsSubmitSave,
      };
      mockUtilObjects.isPositiveInteger.mockReturnValue(true);
      mockUtilObjects.isEmpty.mockReturnValue(true);
      mockSns.promise.mockResolvedValue();

      await expect(mod.handler(event)).resolves.toBe(null);
      expect(mockUtilObjects.isPositiveInteger).toBeCalledTimes(3);
      expect(mockSns.publish).toBeCalledWith(sns);
    });

    it('should return errors with non positive integers', async () => {
      const event = params[1];
      mockUtilObjects.isPositiveInteger.mockReturnValue(false);
      mockUtilObjects.isEmpty.mockReturnValue(false);
      mockSns.promise.mockResolvedValue();

      expect.assertions(2);
      await expect(mod.handler(event)).resolves.toStrictEqual({'errors': {'disable_repeats_duration': 'Please enter a valid integer', 'skip_votes': 'Please enter a valid integer', 'skip_votes_ah': 'Please enter a valid integer'}, 'response_action': 'errors'});
      expect(mockUtilObjects.isPositiveInteger).toBeCalledTimes(3);
    });
  });
});
