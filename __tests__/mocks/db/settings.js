const emptySettings = {
  channel_admins: null,
  playlist: null,
  default_device: null,
  disable_repeats_duration: null,
  back_to_playlist: null,
  skip_votes: null,
  skip_votes_ah: null,
  timezone: null,
};

const fullSettings = {
  channel_admins: ['URVUTD7UP'],
  playlist: {
    name: 'Test',
    id: '2nuwjAGCHQiPabqGH6SLty',
    uri: 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty',
    url: 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
  },
  default_device: {name: 'None', id: 'no_devices'},
  disable_repeats_duration: '3',
  back_to_playlist: 'true',
  skip_votes: '2',
  skip_votes_ah: '0',
  timezone: 'Australia/Melbourne',
};

const fullProfile = {country: 'AU', id: 'samchungy'};

const fullState = {
  channelId: 'CRTKGH71S',
  teamId: 'TRVUTD7DM',
  triggerId: '934362141462.879979449463.8e96b69faba09a350c363e97c5789bc3',
};

const fullDevice = [
  {name: 'None', id: 'no_devices'},
  {
    name: 'AU13282 - Computer',
    id: '87997bb4312981a00f1d8029eb874c55a211a0cc',
  },
];

const fullPlaylists = [
  {
    name: 'Spotbot2',
    id: '5zPStRw3ixlubh9KuwrJpz',
    uri: 'spotify:playlist:5zPStRw3ixlubh9KuwrJpz',
    url: 'https://open.spotify.com/playlist/5zPStRw3ixlubh9KuwrJpz',
  },
  {
    name: 'Spotbot2',
    id: '49tvY7H4eaDNxEWIlHKlID',
    uri: 'spotify:playlist:49tvY7H4eaDNxEWIlHKlID',
    url: 'https://open.spotify.com/playlist/49tvY7H4eaDNxEWIlHKlID',
  },
  {
    name: 'Spotbot2',
    id: '4uBV7ImundaYe8M3880Fnr',
    uri: 'spotify:playlist:4uBV7ImundaYe8M3880Fnr',
    url: 'https://open.spotify.com/playlist/4uBV7ImundaYe8M3880Fnr',
  },
  {
    name: 'Spotbot2',
    id: '3r6Lm9diYas5STzQ3NXkFG',
    uri: 'spotify:playlist:3r6Lm9diYas5STzQ3NXkFG',
    url: 'https://open.spotify.com/playlist/3r6Lm9diYas5STzQ3NXkFG',
  },
  {
    name: 'Spotbot2',
    id: '0F1YuyjVI6EgiMNAWARSZw',
    uri: 'spotify:playlist:0F1YuyjVI6EgiMNAWARSZw',
    url: 'https://open.spotify.com/playlist/0F1YuyjVI6EgiMNAWARSZw',
  },
  {
    name: 'Spotbot',
    id: '6TefVIS1ryrtEmjerqFu1N',
    uri: 'spotify:playlist:6TefVIS1ryrtEmjerqFu1N',
    url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
  },
  {
    name: 'Test',
    id: '2nuwjAGCHQiPabqGH6SLty',
    uri: 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty',
    url: 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
  },
  {
    name: 'DOperatePlaylist',
    id: '5DkqssdyTJyQzh3T0bLPTd',
    uri: 'spotify:playlist:5DkqssdyTJyQzh3T0bLPTd',
    url: 'https://open.spotify.com/playlist/5DkqssdyTJyQzh3T0bLPTd',
  },
  {
    name: 'Spring \'19',
    id: '0AajTcIoODpnHr6m7JqE2Y',
    uri: 'spotify:playlist:0AajTcIoODpnHr6m7JqE2Y',
    url: 'https://open.spotify.com/playlist/0AajTcIoODpnHr6m7JqE2Y',
  },
  {
    name: 'Fall \'19',
    id: '4lB2bRq79GWAd3jDyulDJ8',
    uri: 'spotify:playlist:4lB2bRq79GWAd3jDyulDJ8',
    url: 'https://open.spotify.com/playlist/4lB2bRq79GWAd3jDyulDJ8',
  },
  {
    name: 'Winter \'19',
    id: '2M3YrO6fGfqz4bZHDnmnH5',
    uri: 'spotify:playlist:2M3YrO6fGfqz4bZHDnmnH5',
    url: 'https://open.spotify.com/playlist/2M3YrO6fGfqz4bZHDnmnH5',
  },
  {
    name: 'Pure Joy',
    id: '2j5o5jpPRtw2opTpHqMkXQ',
    uri: 'spotify:playlist:2j5o5jpPRtw2opTpHqMkXQ',
    url: 'https://open.spotify.com/playlist/2j5o5jpPRtw2opTpHqMkXQ',
  },
  {
    name: 'Me',
    id: '1J4m05bC5BKQPTwzxuzzz3',
    uri: 'spotify:playlist:1J4m05bC5BKQPTwzxuzzz3',
    url: 'https://open.spotify.com/playlist/1J4m05bC5BKQPTwzxuzzz3',
  },
  {
    name: 'SSSmas',
    id: '0ykzkVbJFRPiUaacDJHCE2',
    uri: 'spotify:playlist:0ykzkVbJFRPiUaacDJHCE2',
    url: 'https://open.spotify.com/playlist/0ykzkVbJFRPiUaacDJHCE2',
  },
  {
    name: 'SSS BBQ',
    id: '1n3tj3twqXHQhPWUiWthMm',
    uri: 'spotify:playlist:1n3tj3twqXHQhPWUiWthMm',
    url: 'https://open.spotify.com/playlist/1n3tj3twqXHQhPWUiWthMm',
  },
  {
    name: '21',
    id: '7Fv1AvTcY0jAbwzOmGJgHg',
    uri: 'spotify:playlist:7Fv1AvTcY0jAbwzOmGJgHg',
    url: 'https://open.spotify.com/playlist/7Fv1AvTcY0jAbwzOmGJgHg',
  },
  {
    name: 'Soundtracks',
    id: '7atlhhcVVExUiKOMwXLNqU',
    uri: 'spotify:playlist:7atlhhcVVExUiKOMwXLNqU',
    url: 'https://open.spotify.com/playlist/7atlhhcVVExUiKOMwXLNqU',
  },
  {
    name: 'Drunk Songs',
    id: '1XueDduvvEIfEir2GJc8cG',
    uri: 'spotify:playlist:1XueDduvvEIfEir2GJc8cG',
    url: 'https://open.spotify.com/playlist/1XueDduvvEIfEir2GJc8cG',
  },
  {
    name: 'Test',
    id: '099bxvxES7QkJtj4hrejhT',
    uri: 'spotify:playlist:099bxvxES7QkJtj4hrejhT',
    url: 'https://open.spotify.com/playlist/099bxvxES7QkJtj4hrejhT',
  },
  {
    name: 'Musicals',
    id: '2B4H5QMz7Jz07LWNzbWtqp',
    uri: 'spotify:playlist:2B4H5QMz7Jz07LWNzbWtqp',
    url: 'https://open.spotify.com/playlist/2B4H5QMz7Jz07LWNzbWtqp',
  },
  {
    name: 'Liked from Radio',
    id: '6DfnDtWIfXNBPLOLrTnRHt',
    uri: 'spotify:playlist:6DfnDtWIfXNBPLOLrTnRHt',
    url: 'https://open.spotify.com/playlist/6DfnDtWIfXNBPLOLrTnRHt',
  },
  {
    name: 'My Shazam Tracks',
    id: '1b1WGErHarH1cd3mH50IHO',
    uri: 'spotify:playlist:1b1WGErHarH1cd3mH50IHO',
    url: 'https://open.spotify.com/playlist/1b1WGErHarH1cd3mH50IHO',
  },
];

const fullPlaylistSetting = {
  name: 'Test',
  id: '2nuwjAGCHQiPabqGH6SLty',
  uri: 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty',
  url: 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
};


module.exports = {
  emptySettings,
  fullDevice,
  fullPlaylists,
  fullPlaylistSetting,
  fullProfile,
  fullSettings,
  fullState,
};
