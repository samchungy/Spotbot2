const mockMoment = {
  tz: jest.fn(),
  format: jest.fn(),
  names: jest.fn(),
  unix: jest.fn(),
  fromNow: jest.fn(),
  add: jest.fn(),
  isAfter: jest.fn(),
  subtract: jest.fn(),
};
const mockMom = jest.fn(() => mockMoment);
mockMom.unix = jest.fn(() => mockMoment);
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSearchInterface = {
  storeSearch: jest.fn(),
  modelSearch: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockTrack = jest.fn();
const mockSpotifyTracks = {
  fetchArtistTracks: jest.fn(),
};
const mockGetTracks = {
  showResults: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/db/search-interface', () => mockSearchInterface, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-track', () => mockTrack, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-tracks', () => mockSpotifyTracks, {virtual: true});

jest.mock('../../../../src/components/tracks/layers/get-tracks', () => mockGetTracks, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

const mod = require('../../../../src/components/tracks/tracks-find-artists-get-tracks');
const response = mod.RESPONSE;
const {teamId, channelId, responseUrl, userId, triggerId} = require('../../../data/request');
const params = {
  0: {teamId, channelId, triggerId, userId, responseUrl, artistId: 'some artist id'},
};
const artistTracks = require('../../../data/spotify/artistTracks');
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Artists Get Tracks', () => {
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
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
    });
  });

  describe('Main', () => {
    beforeEach(() => {
      mockMom.mockImplementation(() => mockMoment);
    });
    const unix = '123456789';
    const track = {track: true};
    const search = {model: true};
    it('should return call showResults with artist tracks', async () => {
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(unix);
      mockSpotifyTracks.fetchArtistTracks.mockResolvedValue(artistTracks[0]);
      mockTrack.mockReturnValue(track);
      mockSearchInterface.modelSearch.mockReturnValue(search);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyTracks.fetchArtistTracks).toHaveBeenCalledWith(auth, profile.country, params[0].artistId);
      expect(mockMoment.add).toHaveBeenCalledWith('1', 'day');
      expect(mockSearchInterface.modelSearch).toHaveBeenCalledWith(artistTracks[0].tracks.slice(3).map(() => track), params[0].artistId, 1);
      expect(mockSearchInterface.storeSearch).toHaveBeenCalledWith(teamId, channelId, triggerId, search, unix);
      expect(mockSearchInterface.modelSearch).toHaveBeenCalledWith(artistTracks[0].tracks.map(() => track), params[0].artistId, 0);
      expect(mockGetTracks.showResults).toHaveBeenCalledWith(teamId, channelId, userId, triggerId, responseUrl, search);
    });

    it('should return call showResults with artist tracks but not store', async () => {
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(unix);
      mockSpotifyTracks.fetchArtistTracks.mockResolvedValue(artistTracks[1]);
      mockTrack.mockReturnValue(track);
      mockSearchInterface.modelSearch.mockReturnValue(search);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyTracks.fetchArtistTracks).toHaveBeenCalledWith(auth, profile.country, params[0].artistId);
      expect(mockMoment.add).toHaveBeenCalledWith('1', 'day');
      expect(mockSearchInterface.modelSearch).toHaveBeenCalledWith(artistTracks[1].tracks.map(() => track), params[0].artistId, 0);
      expect(mockGetTracks.showResults).toHaveBeenCalledWith(teamId, channelId, userId, triggerId, responseUrl, search);
    });
  });
});

