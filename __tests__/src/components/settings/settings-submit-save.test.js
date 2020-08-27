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
      'create_new_playlist': 'CNP.',
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
  getPlaylist: jest.fn(),
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
jest.mock('/opt/utils/util-objects', () => mockUtilObjects, {virtual: true});

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/db/settings-interface', () => mockSettingsInterface, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormat, {virtual: true});
jest.mock('/opt/slack/slack-api', () => mockSlack, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/db/spotify-auth-interface', () => mockAuthInterface, {virtual: true});
jest.mock('/opt/utils/util-objects', () => mockUtilObjects, {virtual: true});

const mod = require('../../../../src/components/settings/settings-submit-save');
const response = mod.RESPONSE;

const spotifyPlaylists = require('../../../data/spotify/playlist');
const {teamId, channelId, userId, settings} = require('../../../data/request');
const submissions = {
  0: {
    channel_admins: [
      'URVUTD7UP',
    ],
    playlist: '2nuwjAGCHQiPabqGH6SLty',
    default_device: {
      'text': {
        'type': 'plain_text',
        'text': 'AU13282 - Computer',
        'emoji': true,
      },
      'value': '87997bb4312981a00f1d8029eb874c55a211a0cc',
    },
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
    playlist: 'CNP.New Playlist',
    default_device: {
      'text': {
        'type': 'plain_text',
        'text': 'AU13282 - Computer',
        'emoji': true,
      },
      'value': '87997bb4312981a00f1d8029eb874c55a211a0cc',
    },
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
    default_device: {
      'text': {
        'type': 'plain_text',
        'text': 'NONE',
        'emoji': true,
      },
      'value': 'NONE',
    },
    disable_repeats_duration: '1',
    back_to_playlist: 'true',
    ghost_mode: 'true',
    timezone: 'Australia/Melbourne',
    skip_votes: '0',
    skip_votes_ah: '1',
  },
};
const params = {
  0: {teamId, channelId, userId, submissions: submissions[0]},
  1: {teamId, channelId, userId, submissions: submissions[1]}, // New playlist
  2: {teamId, channelId, userId, submissions: submissions[2]}, // No device
};

const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

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
    describe('success', () => {
      it('should call the main function', async () => {
        expect.assertions(1);
        await expect(mod.handler(event(params[0]))).resolves.toBe();
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mockSettingsInterface.loadSettings.mockRejectedValue(error);

        expect.assertions(3);
        await expect(mod.handler(event(params[0]))).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    const playlist = {
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
      },
      'id': '2nuwjAGCHQiPabqGH6SLty',
      'name': 'Test',
      'uri': 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty',
    };
    const modelPlaylist = {
      'name': 'Test',
      'id': '2nuwjAGCHQiPabqGH6SLty',
      'uri': 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty',
      'url': 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
    };
    const modelDevice = {
      'name': 'AU13282 - Computer',
      'id': '87997bb4312981a00f1d8029eb874c55a211a0cc',
    };
    const profile = {
      'country': 'AU',
      'id': 'samchungy',
    };
    const auth = {auth: true};
    it('should successfully save when settings are null', async () => {
      mockSettingsInterface.loadSettings.mockResolvedValue(null);
      mockUtilObjects.isEmpty.mockReturnValue(false);
      mockSettingsInterface.changeSettings.mockResolvedValue();
      mockAuthInterface.removeState.mockResolvedValue();
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockPlaylists.getPlaylist.mockResolvedValue(playlist);
      mockSettingsInterface.modelPlaylist.mockReturnValue(modelPlaylist);
      mockSettingsInterface.modelDevice.mockReturnValue(modelDevice);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeState).toHaveBeenCalledWith(teamId, channelId);
      expect(mockPlaylists.getPlaylist).toHaveBeenCalledWith(auth, submissions[0].playlist);
      expect(mockSettingsInterface.modelPlaylist).toHaveBeenCalledWith(playlist);
      expect(mockSettingsInterface.modelDevice).toHaveBeenCalledWith(submissions[0].default_device.text.text, submissions[0].default_device.value);
      expect(mockSettingsInterface.changeSettings).toHaveBeenCalledWith(teamId, channelId, {'back_to_playlist': 'true', 'channel_admins': ['URVUTD7UP'], 'default_device': modelDevice, 'disable_repeats_duration': '1', 'ghost_mode': 'true', 'playlist': modelPlaylist, 'skip_votes': '0', 'skip_votes_ah': '1', 'timezone': 'Australia/Melbourne'});
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
      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeState).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSettingsInterface.changeSettings).toHaveBeenCalledWith(teamId, channelId, expect.toHavePropertiesNum(2));
    });

    it('should successfully create a new playlist', async () => {
      const auth = {getProfile: () => profile};
      mockSettingsInterface.loadSettings.mockResolvedValue(null);
      mockUtilObjects.isEmpty.mockReturnValue(false);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSettingsInterface.changeSettings.mockResolvedValue();
      mockAuthInterface.removeState.mockResolvedValue();
      mockPlaylists.createPlaylist.mockResolvedValue(spotifyPlaylists[0].items[0]);

      expect.assertions(5);
      await expect(mod.handler(event(params[1]))).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeState).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockPlaylists.createPlaylist).toHaveBeenCalledWith(auth, profile.id, 'New Playlist', mockConfig.spotify_api.playlists.collaborative, mockConfig.spotify_api.playlists.public);
    });

    it('should successfully save with none device', async () => {
      const auth = {getProfile: () => profile};
      mockSettingsInterface.loadSettings.mockResolvedValue(null);
      mockUtilObjects.isEmpty.mockReturnValue(false);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSettingsInterface.changeSettings.mockResolvedValue();
      mockAuthInterface.removeState.mockResolvedValue();

      await expect(mod.handler(event(params[2]))).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeState).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
    });

    it('should succeed when there is nothing to update', async () => {
      mockSettingsInterface.loadSettings.mockResolvedValue(settings);
      mockUtilObjects.isEqual.mockReturnValue(true);
      mockUtilObjects.isEmpty.mockReturnValue(true);
      mockSettingsInterface.changeSettings.mockResolvedValue();
      mockAuthInterface.removeState.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockSettingsInterface.loadSettings).toHaveBeenCalledWith(teamId, channelId);
      expect(mockAuthInterface.removeState).toHaveBeenCalledWith(teamId, channelId);
      expect(mockUtilObjects.isEmpty).toHaveBeenCalledWith({});
      expect(mockSettingsInterface.changeSettings).not.toBeCalled();
    });
  });
});
