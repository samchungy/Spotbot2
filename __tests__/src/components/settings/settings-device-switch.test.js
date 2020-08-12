
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

const mockSettingsInterface = {
  loadSettings: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyDevices = {
  fetchDevices: jest.fn(),
};
const mockSpotifyStatus = {
  fetchCurrentPlayback: jest.fn(),
};
const mockUtilDevice = jest.fn();
const mockSlackApi = {
  post: jest.fn(),
  postEphemeral: jest.fn(),
};
const mockSlackFormatReply = {
  ephemeralPost: jest.fn(),
  inChannelPost: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockSpotifyPlayback = {
  transferDevice: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/db/settings-interface', () => mockSettingsInterface, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-devices', () => mockSpotifyDevices, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-device', () => mockUtilDevice, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback', () => mockSpotifyPlayback, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/settings/settings-device-switch');
const response = mod.RESPONSE;
const {teamId, channelId, userId} = require('../../../data/request');
const devices = require('../../../data/spotify/device');
const status = require('../../../data/spotify/status');
const view = {
  0: {
    'id': 'V018MUFER6E',
    'team_id': 'TRVUTD7DM',
    'type': 'modal',
    'blocks': [{
      'type': 'section',
      'block_id': 'BXLNu',
      'text': {
        'type': 'mrkdwn',
        'text': 'Spotbot will try to keep playing on the current device despite what the default device is set as in the settings. When Spotify is not reporting a device, Spotbot will attempt to fallback onto the default. To change the default, please go to `/spotbot settings`.\n\n *Current Default Device:* DESKTOP-I7U2161 - Computer',
        'verbatim': false,
      },
    },
    {
      'type': 'input',
      'block_id': 'device_modal',
      'label': {
        'type': 'plain_text',
        'text': 'Select a device',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'The device which you will be playing music through.',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'static_select',
        'action_id': 'device_modal',
        'options': [{
          'text': {
            'type': 'plain_text',
            'text': 'AU13282 - Computer',
            'emoji': true,
          },
          'value': '87997bb4312981a00f1d8029eb874c55a211a0cc',
        }],
      },
    },
    ],
    'private_metadata': 'CRU3H4MEC',
    'callback_id': 'device_modal',
    'state': {
      'values': {
        'device_modal': {
          'device_modal': {
            'type': 'static_select',
            'selected_option': {
              'text': {
                'type': 'plain_text',
                'text': 'AU13282 - Computer',
                'emoji': true,
              },
              'value': '87997bb4312981a00f1d8029eb874c55a211a0cc',
            },
          },
        },
      },
    },
    'hash': '1597152352.GRnHrH51',
    'title': {
      'type': 'plain_text',
      'text': 'Spotify Devices',
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
      'text': 'Switch to Device',
      'emoji': true,
    },
    'previous_view_id': null,
    'root_view_id': 'V018MUFER6E',
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
  0: {teamId, channelId, userId, view: view[0]},
  1: {teamId, channelId, userId, view: view[1]}, // wrong view
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
      mockAuthSession.authSession.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
    });
  });

  describe('main', () => {
    it('should do nothing as the device selected is already playing', async () => {
      const auth = {auth: true};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyDevices.fetchDevices).not.toHaveBeenCalled();
    });

    it('should play from selected device as status is not showing anything', async () => {
      const auth = {auth: true};
      const utilDevice = {name: 'name', id: 'id'};
      const post = {inChannel: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue('');
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[2]);
      mockUtilDevice.mockReturnValue(utilDevice);
      mockSpotifyPlayback.transferDevice.mockResolvedValue();
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockUtilDevice).toHaveBeenCalledWith(devices[2].devices[0]);
      expect(mockSpotifyPlayback.transferDevice).toHaveBeenCalledWith(auth, utilDevice.id);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.select(utilDevice.name, userId), null);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should return select device fail when selected device does not match available devices', async () => {
      const auth = {auth: true};
      const post = {ephemeral: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue('');
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[0]);
      mockSlackFormatReply.ephemeralPost.mockReturnValue(post);
      mockSlackApi.postEphemeral.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyDevices.fetchDevices).toHaveBeenCalledWith(auth);
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.select_fail, null);
    });

    it('should fail when there are no values to parse', async () => {
      const auth = {auth: true};
      const post = {ephemeral: true};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue('');
      mockSpotifyDevices.fetchDevices.mockResolvedValue(devices[0]);
      mockSlackFormatReply.ephemeralPost.mockReturnValue(post);
      mockSlackApi.postEphemeral.mockResolvedValue();

      await expect(mod.handler(event(params[1]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).not.toHaveBeenCalled();
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.select_fail, null);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
    });
  });
});
