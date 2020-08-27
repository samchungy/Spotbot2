const mockConfig = {
  spotify_api: {
    playlists: {
      tracks: {
        limit: 100,
      },
    },
  },
};
const mockPlaylists = {
  fetchPlaylistTotal: jest.fn(),
  fetchTracks: jest.fn(),
};
const mockPlaylistTrack = jest.fn();

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-playlist-track', () => mockPlaylistTrack, {virtual: true});

const mod = require('../../../../../src/components/tracks/layers/find-index');
const tracks = require('../../../../data/spotify/tracks');

describe('Remove Unplayable', () => {
  const profile = {country: 'AU'};
  const playlistId = 'playlist-id';
  const auth = {auth: true, getProfile: () => profile};
  const total = {total: 123};
  const available = {uri: 'track uri'};

  it('should throw an error when no tracks are on the playlist', async () => {
    mockPlaylists.fetchPlaylistTotal.mockResolvedValue({total: 0});
    await expect(mod.findTrackIndex(auth, playlistId, profile.country, 'test')).rejects.toStrictEqual(expect.any(Error));
  });

  it('should find the track index', async () => {
    mockPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
    mockPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
    mockPlaylistTrack.mockReturnValue(available);

    await expect(mod.findTrackIndex(auth, playlistId, profile.country, 'track uri')).resolves.toBe(5);
  });

  it('should throw an error when we cannot the track index', async () => {
    mockPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
    mockPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
    mockPlaylistTrack.mockReturnValue(available);

    await expect(mod.findTrackIndex(auth, playlistId, profile.country, 'no match')).rejects.toStrictEqual(expect.any(Error));
  });
});


