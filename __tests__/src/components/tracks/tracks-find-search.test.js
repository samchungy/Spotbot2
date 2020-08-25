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
    'tracks': {
      'limit': 24,
      'info_limit': 50,
    },
  },
};
const mockMoment = {
  tz: jest.fn(),
  format: jest.fn(),
  names: jest.fn(),
  unix: jest.fn(),
  fromNow: jest.fn(),
  add: jest.fn(),
};
const mockMom = jest.fn(() => mockMoment);
mockMom.unix = jest.fn(() => mockMoment);
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const mockSearch = {
  fetchSearchTracks: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockTrack = jest.fn();

const mockSlackApi = {
  postEphemeral: jest.fn(),
};
const mockSlackFormatReply = {
  ephemeralPost: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

const mockSearchInterface = {
  storeSearch: jest.fn(),
  modelSearch: jest.fn(),
};
const mockGetTracks = {
  showResults: jest.fn(),
};

jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-track', () => mockTrack, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-search', () => mockSearch, {virtual: true});


jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

jest.mock('/opt/db/search-interface', () => mockSearchInterface, {virtual: true});

jest.mock('../../../../src/components/tracks/layers/get-tracks', () => mockGetTracks, {virtual: true});

const mod = require('../../../../src/components/tracks/tracks-find-search');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId, triggerId} = require('../../../data/request');
const searchResults = require('../../../data/spotify/searchTracks');
const params = {
  0: {teamId, channelId, settings, userId, query: 'lime', triggerId},
  1: {teamId, channelId, settings, userId, query: '***', triggerId},
  2: {teamId, channelId, settings, userId, query: '', triggerId},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Tracks Find Search', () => {
  const profile = {country: 'AU'};
  const auth = {auth: true, getProfile: () => profile};
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
    beforeEach(() => {
      mockMom.mockImplementation(() => mockMoment);
    });

    const search = {model: true};
    const track = {id: 'some track'};
    const expiryTime = 123456789;
    it('should return search results', async () => {
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSearch.fetchSearchTracks.mockResolvedValue(searchResults[0]);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(expiryTime);
      mockTrack.mockReturnValue(track);
      mockSearchInterface.modelSearch.mockReturnValue(search);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSearch.fetchSearchTracks).toHaveBeenCalledWith(auth, params[0].query, profile.country, mockConfig.spotify_api.tracks.limit);
      expect(mockMoment.add).toHaveBeenCalledWith('1', 'day');
      searchResults[0].tracks.items.forEach((t) => expect(mockTrack).toHaveBeenCalledWith(t));
      expect(mockSearchInterface.modelSearch).toHaveBeenCalledWith(searchResults[0].tracks.items.slice(3).map(mockTrack), params[0].query, 1);
      expect(mockSearchInterface.storeSearch).toHaveBeenCalledWith(teamId, channelId, triggerId, search, expiryTime);
      expect(mockSearchInterface.modelSearch).toHaveBeenCalledWith(searchResults[0].tracks.items.map(mockTrack), params[0].query, 0);
      expect(mockGetTracks.showResults).toHaveBeenCalledWith(teamId, channelId, userId, triggerId, null, search);
    });

    it('should return search results but store none', async () => {
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSearch.fetchSearchTracks.mockResolvedValue(searchResults[2]);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(expiryTime);
      mockTrack.mockReturnValue(track);
      mockSearchInterface.modelSearch.mockReturnValue(search);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSearch.fetchSearchTracks).toHaveBeenCalledWith(auth, params[0].query, profile.country, mockConfig.spotify_api.tracks.limit);
      expect(mockMoment.add).toHaveBeenCalledWith('1', 'day');
      searchResults[2].tracks.items.forEach((t) => expect(mockTrack).toHaveBeenCalledWith(t));
      expect(mockSearchInterface.modelSearch).toHaveBeenCalledWith(searchResults[2].tracks.items.map(mockTrack), params[0].query, 0);
      expect(mockGetTracks.showResults).toHaveBeenCalledWith(teamId, channelId, userId, triggerId, null, search);
    });

    it('should report no results', async () => {
      const ephemeral = {ephemeral: true};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSearch.fetchSearchTracks.mockResolvedValue(searchResults[1]);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(expiryTime);
      mockTrack.mockReturnValue(track);
      mockSlackFormatReply.ephemeralPost.mockReturnValue(ephemeral);

      await expect(mod.handler(event(params[0]))).resolves.toBe();

      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSearch.fetchSearchTracks).toHaveBeenCalledWith(auth, params[0].query, profile.country, mockConfig.spotify_api.tracks.limit);
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.no_tracks + `"${params[0].query}".`, null);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(ephemeral);
    });

    it('should report invalid query', async () => {
      const ephemeral = {ephemeral: true};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSearch.fetchSearchTracks.mockResolvedValue(searchResults[1]);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(expiryTime);
      mockTrack.mockReturnValue(track);
      mockSlackFormatReply.ephemeralPost.mockReturnValue(ephemeral);

      await expect(mod.handler(event(params[1]))).resolves.toBe();

      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.query_error, null);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(ephemeral);
    });

    it('should report empty query', async () => {
      const ephemeral = {ephemeral: true};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSearch.fetchSearchTracks.mockResolvedValue(searchResults[1]);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(expiryTime);
      mockTrack.mockReturnValue(track);
      mockSlackFormatReply.ephemeralPost.mockReturnValue(ephemeral);

      await expect(mod.handler(event(params[2]))).resolves.toBe();

      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.query_empty, null);
      expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(ephemeral);
    });
  });
});
