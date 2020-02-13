module.exports = {
  'spotify_api': {
    'maximum_request_attempts': 1,
    'redirect_url': 'http://localhost:3000/settings/auth/callback',
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
      'limit': 30,
      'info_limit': 50,
    },
    'recent_limit': 5,
  },
  'dynamodb': {
    'auth': {
      'object': 'auth',
      'state': 'state',
      'access': 'access_token',
      'refresh': 'refresh_token',
      'expires': 'expires',
      'view_id': 'view_id',
    },
    'settings': {
      'channel_admins': 'channel_admins',
      'playlist': 'playlist',
      'default_device': 'default_device',
      'disable_repeats_duration': 'disable_repeats_duration',
      'back_to_playlist': 'back_to_playlist',
      'skip_votes': 'skip_votes',
      'skip_votes_ah': 'skip_votes_ah',
      'timezone': 'timezone',
    },
    'settings_extra': {
      'back_to_playlist_state': 'back_to_playlist_state',
      'profile': 'profile',
      'spotify_playlists': 'spotify_playlists',
      'spotify_devices': 'spotify_devices',
      'skip': 'skip',
      'blacklist': 'blacklist',
    },
    'settings_auth': {
      'reauth': 'reauth',
      'auth_url': 'auth_url',
      'auth_verify': 'auth_verify',
      'auth_confirmation': 'auth_confirmation',
      'auth_error': 'auth_error',
    },
    'settings_helper': {
      'no_devices': 'no_devices',
      'no_devices_label': 'None',
      'create_new_playlist': 'create_new_playlist.',
    },
    'blacklist': {
      'limit': 80,
    },
  },
  'settings': {
    'limits': {
      'disable_repeats_duration': 5,
      'skip_votes': 2,
    },
    'query_lengths': {
      'default_device': 0,
      'playlist': 3,
      'timezone': 3,
    },
  },
  'slack': {
    'limits': {
      'max_options': 3,
    },
    'actions': {
      'blacklist_modal': 'blacklist_modal',
      'settings_modal': 'settings_modal',
      'device_modal': 'device_modal',
      'remove_modal': 'remove_modal',
      'playlist': 'playlist',
      'block_actions': 'block_actions',
      'view_submission': 'view_submission',
      'view_closed': 'view_closed',
      'controller': 'controller',
      'controller_overflow': 'controller_overflow',
      'reset_review': 'reset_review',
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
    'reply': {
      'in_channel': 'in_channel',
      'ephemeral': null,
    },
  },
}
;
