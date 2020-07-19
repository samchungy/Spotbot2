// Mock Functions
const config = {
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

const logger = {
  info: jest.fn(),
  error: jest.fn(),
};
const moment = {
  add: jest.fn(),
  unix: jest.fn(),
};
const reportErrorToSlack = jest.fn();
const storePlaylists = jest.fn();
const fetchPlaylists = jest.fn();

// Mock Modules
// Mock Modules
const mockMoment = () => () => ({
  add: moment.add,
  unix: moment.unix,
});
const mockConfig = () => config;
const mockLogger = () => ({
  info: logger.info,
  error: logger.error,
});
const mockSlackFormat = () => ({
  option: jest.fn().mockImplementation((name, value) => ({text: name, value: value})),
  optionGroup: jest.fn().mockImplementation((name, value) => ({text: name, value: value})),
});
const mockSlackErrorReporter = () => ({
  reportErrorToSlack: reportErrorToSlack,
});
const mockSettings = () => ({
  option: jest.fn().mockImplementation((name, value) => ({text: name, value: value})),
  modelPlaylist: jest.fn().mockImplementation((playlist) => ({name: playlist.name, id: playlist.id, url: playlist.external_urls.spotify, uri: playlist.uri})),
  storePlaylists: storePlaylists,
});
const mockPlaylists = () => ({
  fetchPlaylists: fetchPlaylists,
});
const mockAuthSession = () => ({
  authSession: jest.fn(() => ({
    getProfile: jest.fn().mockReturnValue({id: 'samchungy'}),
  })),
});

// Mock Declarations
jest.doMock('/opt/config/config', mockConfig, {virtual: true});
jest.doMock('/opt/utils/util-logger', mockLogger, {virtual: true});
jest.doMock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', mockMoment, {virtual: true});
jest.doMock('/opt/slack/format/slack-format-modal', mockSlackFormat, {virtual: true});
jest.doMock('/opt/slack/slack-error-reporter', mockSlackErrorReporter, {virtual: true});
jest.doMock('/opt/db/settings-interface', mockSettings, {virtual: true});
jest.doMock('/opt/spotify/spotify-api/spotify-api-playlists', mockPlaylists, {virtual: true});
jest.doMock('/opt/spotify/spotify-auth/spotify-auth-session', mockAuthSession, {virtual: true});

const mod = require('../../../src/components/settings/settings-get-options-playlists');
const main = mod.__get__('main');
const playlistData = require('../../data/spotify/playlist');
const response = mod.__get__('RESPONSE');
const {teamId, channelId, userId, settings} = require('../../data/request');
const query = {
  0: 'winter',
  1: 'no playlist',
};
const params = {teamId, channelId, userId, settings, query};
const parameters = {
  0: [teamId, channelId, settings, query[0]], // winter queru
  1: [teamId, channelId, settings, query[1]], // no playlist query
  2: [teamId, channelId, null, query[1]], // no settings
};

describe('Get Playlist Options', () => {
  describe('handler', () => {
    afterAll(() => {
      mod.__ResetDependency__('main');
    });
    const event = params;
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
        expect(logger.error).toHaveBeenCalledWith(error, response.failed);
        expect(reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should return Slack options containing Spotify playlist results', async () => {
      fetchPlaylists.mockResolvedValue(playlistData[0]);
      moment.add.mockReturnThis();
      moment.unix.mockReturnValue(1111111111);

      expect.assertions(5);
      await expect(main(...parameters[0])).resolves.toStrictEqual({'option_groups': [{'text': 'Search Results:', 'value': [{'text': 'Winter \'19', 'value': '2M3YrO6fGfqz4bZHDnmnH5'}]}, {'text': 'Other:', 'value': [{'text': 'Test (Current Selection)', 'value': '2nuwjAGCHQiPabqGH6SLty'}, {'text': 'Create a new playlist called "winter"', 'value': 'create_new_playlist.winter'}]}]});
      expect(fetchPlaylists).toHaveBeenCalled();
      expect(storePlaylists).toHaveBeenCalledWith(teamId, channelId, {'value': [{'id': '2nuwjAGCHQiPabqGH6SLty', 'name': 'Test', 'uri': 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty', 'url': 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty'}, {'id': '4lB2bRq79GWAd3jDyulDJ8', 'name': 'Fall \'19', 'uri': 'spotify:playlist:4lB2bRq79GWAd3jDyulDJ8', 'url': 'https://open.spotify.com/playlist/4lB2bRq79GWAd3jDyulDJ8'}, {'id': '2M3YrO6fGfqz4bZHDnmnH5', 'name': 'Winter \'19', 'uri': 'spotify:playlist:2M3YrO6fGfqz4bZHDnmnH5', 'url': 'https://open.spotify.com/playlist/2M3YrO6fGfqz4bZHDnmnH5'}]}, 1111111111);
      expect(moment.add).toHaveBeenCalledWith(1, 'hour');
      expect(moment.unix).toHaveBeenCalled();
    });

    it('should return Slack options containing no result', async () => {
      fetchPlaylists.mockResolvedValue(playlistData[0]);
      moment.add.mockReturnThis();
      moment.unix.mockReturnValue(1111111111);

      expect.assertions(5);
      await expect(main(...parameters[1])).resolves.toStrictEqual({'option_groups': [{'text': 'No query results for "no playlist"', 'value': [{'text': 'Test (Current Selection)', 'value': '2nuwjAGCHQiPabqGH6SLty'}, {'text': 'Create a new playlist called "no playlist"', 'value': 'create_new_playlist.no playlist'}]}]});
      expect(fetchPlaylists).toHaveBeenCalled();
      expect(storePlaylists).toHaveBeenCalledWith(teamId, channelId, {'value': [{'id': '2nuwjAGCHQiPabqGH6SLty', 'name': 'Test', 'uri': 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty', 'url': 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty'}, {'id': '4lB2bRq79GWAd3jDyulDJ8', 'name': 'Fall \'19', 'uri': 'spotify:playlist:4lB2bRq79GWAd3jDyulDJ8', 'url': 'https://open.spotify.com/playlist/4lB2bRq79GWAd3jDyulDJ8'}, {'id': '2M3YrO6fGfqz4bZHDnmnH5', 'name': 'Winter \'19', 'uri': 'spotify:playlist:2M3YrO6fGfqz4bZHDnmnH5', 'url': 'https://open.spotify.com/playlist/2M3YrO6fGfqz4bZHDnmnH5'}]}, 1111111111);
      expect(moment.add).toHaveBeenCalledWith(1, 'hour');
      expect(moment.unix).toHaveBeenCalled();
    });

    it('should call fetch playlists twice', async () => {
      fetchPlaylists.mockResolvedValue(playlistData[1]);
      moment.add.mockReturnThis();
      moment.unix.mockReturnValue(1111111111);

      expect.assertions(5);
      await expect(main(...parameters[1])).resolves.toStrictEqual({'option_groups': [{'text': 'No query results for "no playlist"', 'value': [{'text': 'Test (Current Selection)', 'value': '2nuwjAGCHQiPabqGH6SLty'}, {'text': 'Create a new playlist called "no playlist"', 'value': 'create_new_playlist.no playlist'}]}]});
      expect(fetchPlaylists).toHaveBeenCalledTimes(2);
      expect(storePlaylists).toHaveBeenCalled();
      expect(moment.add).toHaveBeenCalledWith(1, 'hour');
      expect(moment.unix).toHaveBeenCalled();
    });

    it('should call display results without a current playlist', async () => {
      fetchPlaylists.mockResolvedValue(playlistData[0]);
      moment.add.mockReturnThis();
      moment.unix.mockReturnValue(1111111111);

      expect.assertions(5);
      await expect(main(...parameters[2])).resolves.toStrictEqual({'option_groups': [{'text': 'No query results for "no playlist"', 'value': [{'text': 'Create a new playlist called "no playlist"', 'value': 'create_new_playlist.no playlist'}]}]});
      expect(fetchPlaylists).toHaveBeenCalledTimes(1);
      expect(storePlaylists).toHaveBeenCalled();
      expect(moment.add).toHaveBeenCalledWith(1, 'hour');
      expect(moment.unix).toHaveBeenCalled();
    });
  });
});

