const config = {
  baseUrl: 'https://api.spotify.com/v1',
  baseAuthUrl: 'https://accounts.spotify.com',
  endpoints: {
    me: '/me',
    devices: '/me/player/devices',
    playlists: '/me/playlists',
    playlistItems: (id) => `/playlists/${id}/tracks`,
    createPlaylist: (id) => `/users/${id}/playlists`,
    pause: '/me/player/pause',
    play: '/me/player/play',
    repeat: '/me/player/repeat',
    shuffle: '/me/player/shuffle',
    player: '/me/player',
    recent: '/me/player/recently-played',
    skip: '/me/player/next',
    tracks: '/tracks',
    artistsTracks: (id) => `/artists/${id}/top-tracks`,
    search: '/search',
    profile: (id) => `/users/${id}`,
  },
  authEndpoints: {
    token: '/api/token',
    authorize: '/authorize',
  },
  limits: {
    playlistTracks: 100,
  },
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_SECRET,
  maxRequests: 3,
  errors: {
    expired: 'The access token expired',
  },
};

module.exports = config;
