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
    'settings_helper': {
      'no_devices': 'no_devices',
      'no_devices_label': 'None',
      'create_new_playlist': 'create_new_playlist.',
    },
  },
  'spotify_api': {
    'playlists': {
      'limit': 50,
      'collaborative': true,
      'public': false,
      'tracks': {
        'limit': 100,
      },
    },
  },
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSettingsInterface = {
  changeSettings: jest.fn(),
  loadSettings: jest.fn(),
  modelDevice: jest.fn(),
  modelPlaylist: jest.fn(),
  loadDevices: jest.fn(),
  loadPlaylists: jest.fn(),
};
const mockSlackFormat = {
  ephemeralPost: jest.fn(),
};
const mockSlack = {
  postEphemeral: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockPlaylists = {
  createPlaylist: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockAuthInterface = {
  removeState: jest.fn(),
};
const mockUtilObjects = {
  isEqual: jest.fn(),
  isEmpty: jest.fn(),
};
jest.doMock('/opt/utils/util-objects', () => mockUtilObjects, {virtual: true});

jest.doMock('/opt/config/config', () => mockConfig, {virtual: true});
jest.doMock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.doMock('/opt/db/settings-interface', () => mockSettingsInterface, {virtual: true});
jest.doMock('/opt/slack/format/slack-format-reply', () => mockSlackFormat, {virtual: true});
jest.doMock('/opt/slack/slack-api', () => mockSlack, {virtual: true});
jest.doMock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});
jest.doMock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockPlaylists, {virtual: true});
jest.doMock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.doMock('/opt/db/spotify-auth-interface', () => mockAuthInterface, {virtual: true});
jest.doMock('/opt/utils/util-objects', () => mockUtilObjects, {virtual: true});

const mod = require('../../../src/components/settings/settings-submit-save');
const main = mod.__get__('main');
const response = mod.__get__('RESPONSE');

const spotifyPlaylists = require('../../data/spotify/playlist');
const {teamId, channelId, userId, settings} = require('../../data/request');
const submissions = {
  0: {
    channel_admins: [
      'URVUTD7UP',
    ],
    playlist: '2nuwjAGCHQiPabqGH6SLty',
    default_device: '87997bb4312981a00f1d8029eb874c55a211a0cc',
    disable_repeats_duration: '1',
    back_to_playlist: 'true',
    ghost_mode: 'true',
    timezone: 'Australia/Melbourne',
    skip_votes: '0',
    skip_votes_ah: '1',
  },
  1: {
    channel_admins: [
      'URVUTD7UP',
    ],
    playlist: 'create_new_playlist.New Playlist',
    default_device: '87997bb4312981a00f1d8029eb874c55a211a0cc',
    disable_repeats_duration: '1',
    back_to_playlist: 'true',
    ghost_mode: 'true',
    timezone: 'Australia/Melbourne',
    skip_votes: '0',
    skip_votes_ah: '1',
  },
  2: {
    channel_admins: [
      'URVUTD7UP',
    ],
    playlist: '2nuwjAGCHQiPabqGH6SLty',
    default_device: 'no_devices',
    disable_repeats_duration: '1',
    back_to_playlist: 'true',
    ghost_mode: 'true',
    timezone: 'Australia/Melbourne',
    skip_votes: '0',
    skip_votes_ah: '1',
  },
};
const params = {teamId, channelId, userId, submissions: submissions[0]};
const parameters = {
  0: [teamId, channelId, userId, submissions[0]],
  1: [teamId, channelId, userId, submissions[1]], // New playlist
  2: [teamId, channelId, userId, submissions[2]], // No device
};

describe('Settings - Submit Save', () => {
  beforeAll(() => {
    expect.extend({
      toHavePropertiesNum(received, length) {
        const pass = received.constructor === Object && Object.entries(received).length === length;
        if (pass) {
          return {
            message: () =>
              `expected ${received} not to have ${length} of properties`,
            pass: true,
          };
        } else {
          return {
            message: () =>
              `expected ${received} to have ${length} of properties`,
            pass: false,
          };
        }
      },
    });
  });
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
        expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    const playlists = {'value': [
      {
        'name': 'New',
        'id': '6wJYsAv6EUHfafNvTV3Qvf',
        'uri': 'spotify:playlist:6wJYsAv6EUHfafNvTV3Qvf',
        'url': 'https://open.spotify.com/playlist/6wJYsAv6EUHfafNvTV3Qvf',
      },
      {
        'name': 'Spotbot',
        'id': '6TefVIS1ryrtEmjerqFu1N',
        'uri': 'spotify:playlist:6TefVIS1ryrtEmjerqFu1N',
        'url': 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      },
      {
        'name': 'Test',
        'id': '2nuwjAGCHQiPabqGH6SLty',
        'uri': 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty',
        'url': 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
      },
      {
        'name': 'DOperatePlaylist',
        'id': '5DkqssdyTJyQzh3T0bLPTd',
        'uri': 'spotify:playlist:5DkqssdyTJyQzh3T0bLPTd',
        'url': 'https://open.spotify.com/playlist/5DkqssdyTJyQzh3T0bLPTd',
      },
      {
        'name': 'Spring \'19',
        'id': '0AajTcIoODpnHr6m7JqE2Y',
        'uri': 'spotify:playlist:0AajTcIoODpnHr6m7JqE2Y',
        'url': 'https://open.spotify.com/playlist/0AajTcIoODpnHr6m7JqE2Y',
      },
      {
        'name': 'Fall \'19',
        'id': '4lB2bRq79GWAd3jDyulDJ8',
        'uri': 'spotify:playlist:4lB2bRq79GWAd3jDyulDJ8',
        'url': 'https://open.spotify.com/playlist/4lB2bRq79GWAd3jDyulDJ8',
      },
      {
        'name': 'Winter \'19',
        'id': '2M3YrO6fGfqz4bZHDnmnH5',
        'uri': 'spotify:playlist:2M3YrO6fGfqz4bZHDnmnH5',
        'url': 'https://open.spotify.com/playlist/2M3YrO6fGfqz4bZHDnmnH5',
      },
      {
        'name': 'Pure Happy Bliss',
        'id': '2j5o5jpPRtw2opTpHqMkXQ',
        'uri': 'spotify:playlist:2j5o5jpPRtw2opTpHqMkXQ',
        'url': 'https://open.spotify.com/playlist/2j5o5jpPRtw2opTpHqMkXQ',
      },
      {
        'name': 'Me',
        'id': '1J4m05bC5BKQPTwzxuzzz3',
        'uri': 'spotify:playlist:1J4m05bC5BKQPTwzxuzzz3',
        'url': 'https://open.spotify.com/playlist/1J4m05bC5BKQPTwzxuzzz3',
      },
      {
        'name': 'SSSmas',
        'id': '0ykzkVbJFRPiUaacDJHCE2',
        'uri': 'spotify:playlist:0ykzkVbJFRPiUaacDJHCE2',
        'url': 'https://open.spotify.com/playlist/0ykzkVbJFRPiUaacDJHCE2',
      },
      {
        'name': 'SSS BBQ',
        'id': '1n3tj3twqXHQhPWUiWthMm',
        'uri': 'spotify:playlist:1n3tj3twqXHQhPWUiWthMm',
        'url': 'https://open.spotify.com/playlist/1n3tj3twqXHQhPWUiWthMm',
      },
      {
        'name': '21',
        'id': '7Fv1AvTcY0jAbwzOmGJgHg',
        'uri': 'spotify:playlist:7Fv1AvTcY0jAbwzOmGJgHg',
        'url': 'https://open.spotify.com/playlist/7Fv1AvTcY0jAbwzOmGJgHg',
      },
      {
        'name': 'The Work Zone',
        'id': '7atlhhcVVExUiKOMwXLNqU',
        'uri': 'spotify:playlist:7atlhhcVVExUiKOMwXLNqU',
        'url': 'https://open.spotify.com/playlist/7atlhhcVVExUiKOMwXLNqU',
      },
      {
        'name': 'Drunk Songs',
        'id': '1XueDduvvEIfEir2GJc8cG',
        'uri': 'spotify:playlist:1XueDduvvEIfEir2GJc8cG',
        'url': 'https://open.spotify.com/playlist/1XueDduvvEIfEir2GJc8cG',
      },
      {
        'name': 'Musicals',
        'id': '2B4H5QMz7Jz07LWNzbWtqp',
        'uri': 'spotify:playlist:2B4H5QMz7Jz07LWNzbWtqp',
        'url': 'https://open.spotify.com/playlist/2B4H5QMz7Jz07LWNzbWtqp',
      },
      {
        'name': 'Liked from Radio',
        'id': '6DfnDtWIfXNBPLOLrTnRHt',
        'uri': 'spotify:playlist:6DfnDtWIfXNBPLOLrTnRHt',
        'url': 'https://open.spotify.com/playlist/6DfnDtWIfXNBPLOLrTnRHt',
      },
      {
        'name': 'My Shazam Tracks',
        'id': '1b1WGErHarH1cd3mH50IHO',
        'uri': 'spotify:playlist:1b1WGErHarH1cd3mH50IHO',
        'url': 'https://open.spotify.com/playlist/1b1WGErHarH1cd3mH50IHO',
      },
    ],
    'ttl': 1595937365,
    };
    const devices = {'value': [
      {
        'name': 'AU13282 - Computer',
        'id': '87997bb4312981a00f1d8029eb874c55a211a0cc',
      },
      {
        'name': 'DESKTOP-I7U2161 - Computer',
        'id': '49433c0b9868f755ee05b5a58908f31c8d28faaf',
      },
    ],
    'ttl': 1595936916};
    const profile = {
      'country': 'AU',
      'id': 'samchungy',
    };
    it('should successfully save when settings are null', async () => {
      mockSettingsInterface.loadSettings.mockResolvedValue(null);
      mockSettingsInterface.loadDevices.mockResolvedValue(devices);
      mockSettingsInterface.loadPlaylists.mockResolvedValue(playlists);
      mockUtilObjects.isEmpty.mockReturnValue(false);
      mockSettingsInterface.changeSettings.mockResolvedValue();
      mockAuthInterface.removeState.mockResolvedValue();

      expect.assertions(6);
      await expect(main(...parameters[0])).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.loadDevices).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.loadPlaylists).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeState).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.changeSettings).toHaveBeenCalledWith(teamId, channelId, {
        'back_to_playlist': 'true',
        'channel_admins': [
          'URVUTD7UP',
        ],
        'default_device': {
          'id': '87997bb4312981a00f1d8029eb874c55a211a0cc',
          'name': 'AU13282 - Computer',
        },
        'disable_repeats_duration': '1',
        'ghost_mode': 'true',
        'playlist': {
          'id': '2nuwjAGCHQiPabqGH6SLty',
          'name': 'Test',
          'uri': 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty',
          'url': 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
        },
        'skip_votes': '0',
        'skip_votes_ah': '1',
        'timezone': 'Australia/Melbourne',
      });
    });

    it('should successfully overrite when settings some settings', async () => {
      mockSettingsInterface.loadSettings.mockResolvedValue(settings);
      mockUtilObjects.isEmpty.mockReturnValue(false);
      mockSettingsInterface.changeSettings.mockResolvedValue();
      mockAuthInterface.removeState.mockResolvedValue();
      mockUtilObjects.isEqual
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(false)
          .mockReturnValue(true);

      expect.assertions(4);
      await expect(main(...parameters[0])).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeState).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.changeSettings).toHaveBeenCalledWith(teamId, channelId, expect.toHavePropertiesNum(2));
    });

    it('should successfully create a new playlist', async () => {
      const auth = {getProfile: () => profile};
      mockSettingsInterface.loadSettings.mockResolvedValue(null);
      mockUtilObjects.isEmpty.mockReturnValue(false);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSettingsInterface.loadDevices.mockResolvedValue(devices);
      mockSettingsInterface.changeSettings.mockResolvedValue();
      mockAuthInterface.removeState.mockResolvedValue();
      mockPlaylists.createPlaylist.mockResolvedValue(spotifyPlaylists[0].items[0]);

      expect.assertions(5);
      await expect(main(...parameters[1])).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeState).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockPlaylists.createPlaylist).toHaveBeenCalledWith(auth, profile.id, 'New Playlist', mockConfig.spotify_api.playlists.collaborative, mockConfig.spotify_api.playlists.public);
    });

    it('should fail when load playlists is null', async () => {
      mockSettingsInterface.loadSettings.mockResolvedValue(null);
      mockSettingsInterface.loadDevices.mockResolvedValue(devices);
      mockSettingsInterface.loadPlaylists.mockResolvedValue(null);

      expect.assertions(3);
      await expect(main(...parameters[0])).rejects.toHaveProperty('message', 'No playlist data was captured for Settings');
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.loadPlaylists).toHaveBeenCalledWith(teamId, channelId);
    });

    it('should fail when load devices is null', async () => {
      mockSettingsInterface.loadPlaylists.mockResolvedValue(playlists);
      mockSettingsInterface.loadSettings.mockResolvedValue(null);
      mockSettingsInterface.loadDevices.mockResolvedValue(null);

      expect.assertions(3);
      await expect(main(...parameters[0])).rejects.toHaveProperty('message', 'No Spotify device data was captured for Settings');
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.loadPlaylists).toHaveBeenCalledWith(teamId, channelId);
    });

    it('should fail when load playlists does not contain selected playlist', async () => {
      mockSettingsInterface.loadPlaylists.mockResolvedValue({value: [{id: 'not our playlist'}]});
      mockSettingsInterface.loadSettings.mockResolvedValue(null);

      expect.assertions(3);
      await expect(main(...parameters[0])).rejects.toHaveProperty('message', 'Selected Spotify playlist is invalid');
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.loadPlaylists).toHaveBeenCalledWith(teamId, channelId);
    });

    it('should fail when load devices does not contain selected device', async () => {
      mockSettingsInterface.loadSettings.mockResolvedValue(null);
      mockSettingsInterface.loadPlaylists.mockResolvedValue(playlists);
      mockSettingsInterface.loadDevices.mockResolvedValue({value: [{id: 'not our device'}]});

      expect.assertions(3);
      await expect(main(...parameters[0])).rejects.toHaveProperty('message', 'Selected Spotify device is invalid');
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.loadPlaylists).toHaveBeenCalledWith(teamId, channelId);
    });

    it('should succeed when no device option is selected', async () => {
      mockSettingsInterface.loadSettings.mockResolvedValue(null);
      mockSettingsInterface.loadPlaylists.mockResolvedValue(playlists);

      expect.assertions(4);
      await expect(main(...parameters[2])).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.loadPlaylists).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.modelDevice).toHaveBeenCalledWith(mockConfig.dynamodb.settings_helper.no_devices_label, mockConfig.dynamodb.settings_helper.no_devices);
    });

    it('should succeed when there is nothing to update', async () => {
      mockSettingsInterface.loadSettings.mockResolvedValue(settings);
      mockUtilObjects.isEqual.mockReturnValue(true);
      mockUtilObjects.isEmpty.mockReturnValue(true);
      mockSettingsInterface.changeSettings.mockResolvedValue();
      mockAuthInterface.removeState.mockResolvedValue();

      expect.assertions(5);
      await expect(main(...parameters[0])).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeState).toHaveBeenCalledWith(teamId, channelId);
      expect(mockUtilObjects.isEmpty).toHaveBeenCalledWith({});
      expect(mockSettingsInterface.changeSettings).not.toBeCalled();
    });
  });
});
