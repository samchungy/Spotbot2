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
  deleteTracks: jest.fn(),
  fetchTracks: jest.fn(),
};
const mockPlaylistTrack = jest.fn();

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-playlist-track', () => mockPlaylistTrack, {virtual: true});

const mod = require('../../../../../src/components/tracks/layers/remove-unplayable');
const tracks = require('../../../../data/spotify/tracks');

describe('Remove Unplayable', () => {
  const profile = {country: 'AU'};
  const playlistId = 'playlist-id';
  const auth = {auth: true, getProfile: () => profile};
  const total = {total: 123};
  const available = {isPlayable: true, uri: 'track uri'};
  const unavailable = {isPlayable: false, uri: 'other track uri'};

  it('should remove unplayable tracks from the playlist', async () => {
    mockPlaylists.deleteTracks.mockResolvedValue();
    mockPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
    mockPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
    mockPlaylistTrack
        .mockReturnValueOnce(unavailable)
        .mockReturnValueOnce(unavailable)
        .mockReturnValue(available);

    await expect(mod.removeUnplayable(auth, playlistId)).resolves.toBe();
    expect(mockPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, playlistId);
    expect(mockPlaylists.fetchTracks).toHaveBeenCalledWith(auth, playlistId, profile.country, 0);
    tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
    expect(mockPlaylists.deleteTracks).toHaveBeenCalledWith(auth, playlistId, [{uri: unavailable.uri}, {uri: unavailable.uri}]);
  });

  it('should return nothing for the total', async () => {
    mockPlaylists.deleteTracks.mockResolvedValue();
    mockPlaylists.fetchPlaylistTotal.mockResolvedValue({total: 0});
    mockPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
    mockPlaylistTrack.mockReturnValue(available);

    await expect(mod.removeUnplayable(auth, playlistId)).resolves.toBe();
    expect(mockPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, playlistId);
  });

  it('should remove no tracks from the playlist', async () => {
    mockPlaylists.deleteTracks.mockResolvedValue();
    mockPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
    mockPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
    mockPlaylistTrack .mockReturnValue(available);

    await expect(mod.removeUnplayable(auth, playlistId)).resolves.toBe();
    expect(mockPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, playlistId);
    expect(mockPlaylists.fetchTracks).toHaveBeenCalledWith(auth, playlistId, profile.country, 0);
    tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
  });
});
