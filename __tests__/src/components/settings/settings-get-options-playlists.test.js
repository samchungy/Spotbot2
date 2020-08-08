/* eslint-disable no-unused-vars */
// Mock Functions
const mockConfig = {
  dynamodb: {
    settings_helper: {
      no_devices: 'no_devices',
      no_devices_label: 'no_devices_label',
      create_new_playlist: 'create_new_playlist.',
    },
    settings: {
      default_device: 'default_device',
      playlist: 'playlist',
    },
  },
  spotify_api: {
    playlists: {
      limit: 100,
    },
  },
};

// Mock Modules
const mockMoment = {
  tz: jest.fn().mockReturnThis(),
  format: jest.fn(),
  add: jest.fn(),
  unix: jest.fn(),
  names: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSlackFormat = {
  option: jest.fn(),
  optionGroup: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockSettings = {
  option: jest.fn(),
  modelPlaylist: jest.fn(),
  storePlaylists: jest.fn(),
};
const mockPlaylists = {
  fetchPlaylists: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(() => ({
    getProfile: jest.fn(),
  })),
};

// Mock Declarations
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => {
  const mock = () => mockMoment;
  mock.tz = mockMoment;
  return mock;
}, {virtual: true});
jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackFormat, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});
jest.mock('/opt/db/settings-interface', () => mockSettings, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});

const mod = require('../../../../src/components/settings/settings-get-options-playlists');
const response = mod.RESPONSE;
const option = mod.OPTION;
const playlistData = require('../../../data/spotify/playlist');

const {teamId, channelId, userId, settings} = require('../../../data/request');
const query = {
  0: 'winter',
};
const params = {
  0: {teamId, channelId, settings, query: query[0]}, // winter queru
  1: {teamId, channelId, settings: null, query: query[0]}, // no settings
};

describe('Get Playlist Options', () => {
  describe('handler', () => {
    const event = params[0];
    describe('success', () => {
      it('should call the main function', async () => {
        await expect(mod.handler(event)).resolves.toBe();
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mockAuthSession.authSession.mockRejectedValue(error);

        await expect(mod.handler(event)).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should return Slack options containing Spotify playlist results', async () => {
      const event = params[0];
      const opt = {option: true};
      const profile = {id: 'samchungy'};
      const auth = {auth: true, getProfile: () => profile};
      const modelPlaylist = {name: 'name', id: 'id'};
      const matchPlaylist = {name: query[0] + 'extra jargon', id: 'id'};
      const unix = 1111111111;
      const validPlaylist = {
        0: '4lB2bRq79GWAd3jDyulDJ8',
        1: '2M3YrO6fGfqz4bZHDnmnH5',
      };
      const optGroup = {optionGroup: true};

      mockSlackFormat.optionGroup.mockReturnValue(optGroup);
      mockSettings.modelPlaylist.mockReturnValueOnce(matchPlaylist).mockReturnValue(modelPlaylist);
      mockSlackFormat.option.mockReturnValue(opt);
      mockPlaylists.fetchPlaylists.mockResolvedValue(playlistData[0]);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(unix);

      await expect(mod.handler(event)).resolves.toStrictEqual({option_groups: [optGroup, optGroup]});
      expect(mockSlackFormat.option).toHaveBeenCalledWith(option.current(settings.playlist.name), settings.playlist.id);
      expect(mockSlackFormat.option).toHaveBeenCalledWith(option.createPlaylist(query[0]), option.newPlaylist(query[0]));
      expect(mockSlackFormat.option).toHaveBeenCalledWith(matchPlaylist.name, matchPlaylist.id);
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockPlaylists.fetchPlaylists).toHaveBeenCalledWith(auth, 0, mockConfig.spotify_api.playlists.limit);
      expect(mockSettings.modelPlaylist).toHaveBeenCalledWith(expect.objectContaining({id: validPlaylist[0]}));
      expect(mockSettings.modelPlaylist).toHaveBeenCalledWith(expect.objectContaining({id: validPlaylist[1]}));
      expect(mockSettings.storePlaylists).toHaveBeenCalledWith(teamId, channelId, {value: [settings.playlist, matchPlaylist, modelPlaylist]}, unix);
      expect(mockMoment.add).toHaveBeenCalledWith(1, 'hour');
      expect(mockMoment.unix).toHaveBeenCalled();
      expect(mockSlackFormat.optionGroup).toHaveBeenCalledWith('Search Results:', [opt]);
      expect(mockSlackFormat.optionGroup).toHaveBeenCalledWith('Other:', [opt, opt]);
    });

    it('should return Slack options containing no playlist results from Spotify', async () => {
      const event = params[0];
      const opt = {option: true};
      const profile = {id: 'samchungy'};
      const auth = {auth: true, getProfile: () => profile};
      const modelPlaylist = {name: 'name', id: 'id'};
      const unix = 1111111111;
      const validPlaylist = {
        0: '4lB2bRq79GWAd3jDyulDJ8',
        1: '2M3YrO6fGfqz4bZHDnmnH5',
      };
      const optGroup = {optionGroup: true};

      mockSlackFormat.optionGroup.mockReturnValue(optGroup);
      mockSettings.modelPlaylist.mockReturnValue(modelPlaylist);
      mockSlackFormat.option.mockReturnValue(opt);
      mockPlaylists.fetchPlaylists.mockResolvedValue(playlistData[0]);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(unix);

      await expect(mod.handler(event)).resolves.toStrictEqual({option_groups: [optGroup]});
      expect(mockSlackFormat.option).toHaveBeenCalledWith(option.current(settings.playlist.name), settings.playlist.id);
      expect(mockSlackFormat.option).toHaveBeenCalledWith(option.createPlaylist(query[0]), option.newPlaylist(query[0]));
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockPlaylists.fetchPlaylists).toHaveBeenCalledWith(auth, 0, mockConfig.spotify_api.playlists.limit);
      expect(mockSettings.modelPlaylist).toHaveBeenCalledWith(expect.objectContaining({id: validPlaylist[0]}));
      expect(mockSettings.modelPlaylist).toHaveBeenCalledWith(expect.objectContaining({id: validPlaylist[1]}));
      expect(mockSettings.storePlaylists).toHaveBeenCalledWith(teamId, channelId, {value: [settings.playlist, modelPlaylist, modelPlaylist]}, unix);
      expect(mockMoment.add).toHaveBeenCalledWith(1, 'hour');
      expect(mockMoment.unix).toHaveBeenCalled();
      expect(mockSlackFormat.optionGroup).toHaveBeenCalledWith(option.none(query[0]), [opt, opt]);
    });

    it('should call fetchplaylist twice', async () => {
      const event = params[0];
      const opt = {option: true};
      const profile = {id: 'samchungy'};
      const auth = {auth: true, getProfile: () => profile};
      const modelPlaylist = {name: 'name', id: 'id'};
      const unix = 1111111111;
      const validPlaylist = {
        0: '4lB2bRq79GWAd3jDyulDJ8',
        1: '2M3YrO6fGfqz4bZHDnmnH5',
      };
      const optGroup = {optionGroup: true};

      mockSlackFormat.optionGroup.mockReturnValue(optGroup);
      mockSettings.modelPlaylist.mockReturnValue(modelPlaylist);
      mockSlackFormat.option.mockReturnValue(opt);
      mockPlaylists.fetchPlaylists.mockResolvedValue(playlistData[1]);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(unix);

      await mod.handler(event);
      expect(mockSlackFormat.option).toHaveBeenCalledWith(option.current(settings.playlist.name), settings.playlist.id);
      expect(mockSlackFormat.option).toHaveBeenCalledWith(option.createPlaylist(query[0]), option.newPlaylist(query[0]));
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockPlaylists.fetchPlaylists).toHaveBeenCalledTimes(2);
    });

    it('should return results without a current playlist', async () => {
      const event = params[1];
      const opt = {option: true};
      const profile = {id: 'samchungy'};
      const auth = {auth: true, getProfile: () => profile};
      const modelPlaylist = {name: 'name', id: 'id'};
      const unix = 1111111111;
      const validPlaylist = {
        0: '4lB2bRq79GWAd3jDyulDJ8',
        1: '2M3YrO6fGfqz4bZHDnmnH5',
      };
      const optGroup = {optionGroup: true};

      mockSlackFormat.optionGroup.mockReturnValue(optGroup);
      mockSettings.modelPlaylist.mockReturnValue(modelPlaylist);
      mockSlackFormat.option.mockReturnValue(opt);
      mockPlaylists.fetchPlaylists.mockResolvedValue(playlistData[0]);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(unix);

      await expect(mod.handler(event)).resolves.toStrictEqual({option_groups: [optGroup]});
      expect(mockSlackFormat.option).toHaveBeenCalledWith(option.createPlaylist(query[0]), option.newPlaylist(query[0]));
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockPlaylists.fetchPlaylists).toHaveBeenCalledWith(auth, 0, mockConfig.spotify_api.playlists.limit);
      expect(mockSettings.modelPlaylist).toHaveBeenCalledWith(expect.objectContaining({id: validPlaylist[0]}));
      expect(mockSettings.modelPlaylist).toHaveBeenCalledWith(expect.objectContaining({id: validPlaylist[1]}));
      expect(mockSettings.storePlaylists).toHaveBeenCalledWith(teamId, channelId, {value: [modelPlaylist, modelPlaylist]}, unix);
      expect(mockMoment.add).toHaveBeenCalledWith(1, 'hour');
      expect(mockMoment.unix).toHaveBeenCalled();
      expect(mockSlackFormat.optionGroup).toHaveBeenCalledWith(option.none(query[0]), [opt]);
    });
  });
});

