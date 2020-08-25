const mockConfig = {
  'spotify_api': {
    'maximum_request_attempts': 3,
    'scopes': [
      'user-read-private',
      'user-read-email',
      'user-read-recently-played',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-collaborative',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
      'streaming',
    ],
    'playlists': {
      'limit': 50,
      'collaborative': true,
      'public': false,
      'tracks': {
        'limit': 100,
      },
    },
    'africa': 'spotify:track:2374M0fQpWi3dLnB54qaLX',
    'tracks': {
      'limit': 24,
      'info_limit': 50,
    },
    'recent_limit': 5,
  },
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
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSpotifyTracks = {
  fetchTracksInfo: jest.fn(),
};
const mockSpotifyPlaylists = {
  deleteTracks: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};

const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockTrack = jest.fn();
const mockSlackFormatReply = {
  inChannelPost: jest.fn(),
};
const mockSlackApi = {
  post: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-tracks', () => mockSpotifyTracks, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-track', () => mockTrack, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/tracks/tracks-remove-submit');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId} = require('../../../data/request');
const tracks = require('../../../data/spotify/tracks');
const view = {
  0: {
    'id': 'V019CTAAKDG',
    'team_id': 'TRVUTD7DM',
    'type': 'modal',
    'blocks': [{
      'type': 'input',
      'block_id': 'remove_modal',
      'label': {
        'type': 'plain_text',
        'text': 'Select Tracks to Remove',
        'emoji': true,
      },
      'hint': {
        'type': 'plain_text',
        'text': 'Selected tracks will be removed when you click Confirm',
        'emoji': true,
      },
      'optional': false,
      'element': {
        'type': 'multi_static_select',
        'action_id': 'remove_modal',
        'options': [{
          'text': {
            'type': 'plain_text',
            'text': 'Lime Cordiale - Inappropriate Behaviour',
            'emoji': true,
          },
          'value': '5ev47QYsBU46zhjnHC3Jmh',
        }],
      },
    }],
    'private_metadata': 'CRU3H4MEC',
    'callback_id': 'remove_modal',
    'state': {
      'values': {
        'remove_modal': {
          'remove_modal': {
            'type': 'multi_static_select',
            'selected_options': [{
              'text': {
                'type': 'plain_text',
                'text': 'Lime Cordiale - Inappropriate Behaviour',
                'emoji': true,
              },
              'value': '5ev47QYsBU46zhjnHC3Jmh',
            }],
          },
        },
      },
    },
    'hash': '1598275299.GOGzRVS7',
    'title': {
      'type': 'plain_text',
      'text': 'Remove Tracks',
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
    'root_view_id': 'V019CTAAKDG',
    'app_id': 'A012EC4351T',
    'external_id': '',
    'app_installed_team_id': 'TRVUTD7DM',
    'bot_id': 'B012FPR625Q',
  },
};
const params = {
  0: {teamId, channelId, settings, userId, view: view[0]},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});


describe('Tracks Remove Submit', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockAuthSession.authSession.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, userId, response.failed);
    });
  });

  describe('Main', () => {
    it('should successfully remove tracks', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });
  });
});
