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
};
const mockTrack = jest.fn();
const mockSpotifyPlaylists = {
  fetchTracks: jest.fn(),
};
const mockMoment = {
  tz: jest.fn().mockReturnThis(),
  format: jest.fn(),
  add: jest.fn(),
  unix: jest.fn(),
  names: jest.fn(),
  subtract: jest.fn(),
  isAfter: jest.fn(),
};
const mockMom = jest.fn(() => mockMoment);
mockMom.tz = jest.fn(() => mockMoment);

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-playlist-track', () => mockTrack, {virtual: true});

const mod = require('../../../../../src/components/control/layers/control-reset');
const {settings} = require('../../../../data/request');
const tracks = require('../../../../data/spotify/tracks');

describe('Control Reset Layers', () => {
  it('should return reviewTracks', async () => {
    const auth = {auth: true};
    const playlistTrack = {track: true, addedAt: 'date'};
    const total = 123;
    const time = {moment: true};

    mockTrack.mockReturnValue(playlistTrack);
    mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
    mockMoment.isAfter.mockReturnValue(true);
    mockMoment.subtract.mockReturnValue(time);

    await expect(mod.getReviewTracks(auth, settings.playlist, total)).resolves.toStrictEqual(tracks[0].items.map(() => playlistTrack));
    expect(mockMoment.isAfter).toHaveBeenCalledWith(time);
    expect(mockMom).toHaveBeenNthCalledWith(1);
    tracks[0].items.forEach((t, i) => {
      expect(mockMom).toHaveBeenNthCalledWith(i+2, playlistTrack.addedAt);
    });
  });
});

