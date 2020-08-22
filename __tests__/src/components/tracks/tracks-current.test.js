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
const mockSns = {
  publish: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};
const mockSpotifyDevices = {
  fetchDevices: jest.fn(),
};
const mockSpotifyPlayback = {
  play: jest.fn(),
};
const mockSpotifyStatus = {
  fetchCurrentPlayback: jest.fn(),
};
const mockSpotifyHelper = {
  onPlaylist: jest.fn(),
  isPlaying: jest.fn(),
};
const mockSlackApi = {
  post: jest.fn(),
  reply: jest.fn(),
};
const mockSlackBlocks = {
  contextSection: jest.fn(),
  textSection: jest.fn(),
};
const mockSlackFormatReply = {
  inChannelPost: jest.fn(),
};
const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};
const mockSpotifyPlaylists = {
  fetchPlaylistTotal: jest.fn(),
  fetchTracks: jest.fn(),
};
const mockPlaylistTrack = jest.fn();
const mockTrack = jest.fn();
const mockUtilTimeout = {
  sleep: jest.fn(),
};
const mockSkip = {
  onBlacklist: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-devices', () => mockSpotifyDevices, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback', () => mockSpotifyPlayback, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-helper', () => mockSpotifyHelper, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-playlist-track', () => mockPlaylistTrack, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-track', () => mockTrack, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackBlocks, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

jest.mock('/opt/control-skip/control-skip', () => mockSkip, {virtual: true});

jest.mock('/opt/utils/util-timeout', () => mockUtilTimeout, {virtual: true});

const mod = require('../../../../src/components/tracks/tracks-current');
const response = mod.RESPONSE;
const {teamId, channelId, settings, settings2} = require('../../../data/request');
const status = require('../../../data/spotify/status');
const tracks = require('../../../data/spotify/tracks');
const params = {
  0: {teamId, channelId, settings},
  1: {teamId, channelId, settings: settings2}, // B2P = true
  2: {teamId, channelId, settings: settings2, afterSkip: true},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Tracks Current', () => {
  describe('Handler', () => {
    it('should return successfully', async () => {
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockAuthSession.authSession.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, null, response.failed);
    });
  });

  describe('main', () => {
    const auth = {auth: true};
    const post = {inChannelPost: true};
    const track = {uri: 'uri', title: 'song title'};
    const wrongTrack = {uri: 'not the uri', title: 'another song title'};
    const textSection = {text: true};
    const context = {context: true};

    it('should successfully return playing on playlist status with position on playlist and next context', async () => {
      const total = {total: tracks[0].items.length};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSlackBlocks.textSection.mockReturnValue(textSection);
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockTrack.mockReturnValueOnce(track); // Status Call
      mockPlaylistTrack
          .mockReturnValueOnce(wrongTrack)
          .mockReturnValueOnce(track)
          .mockReturnValue(wrongTrack);
      mockSlackBlocks.contextSection.mockReturnValue(context);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.currently_playing(track.title));
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.context_on(`<${settings.playlist.url}|${settings.playlist.name}>`, 2, tracks[0].items.length));
      expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.context_track(wrongTrack.title));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.currently_playing(track.title), [textSection, context, context]);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully return playing on playlist status with position on playlist without next context', async () => {
      const total = {total: tracks[0].items.length};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSlackBlocks.textSection.mockReturnValue(textSection);
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockTrack.mockReturnValueOnce(track); // Status Call
      mockPlaylistTrack
          .mockReturnValueOnce(wrongTrack)
          .mockReturnValueOnce(wrongTrack)
          .mockReturnValueOnce(wrongTrack)
          .mockReturnValueOnce(wrongTrack)
          .mockReturnValueOnce(wrongTrack)
          .mockReturnValueOnce(track);
      mockSlackBlocks.contextSection.mockReturnValue(context);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.currently_playing(track.title));
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.context_on(`<${settings.playlist.url}|${settings.playlist.name}>`, 6, tracks[0].items.length));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.currently_playing(track.title), [textSection, context]);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully return playing on playlist status without position on playlist (more than one track instance)', async () => {
      const total = {total: tracks[0].items.length};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSlackBlocks.textSection.mockReturnValue(textSection);
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockTrack.mockReturnValueOnce(track); // Status Call
      mockPlaylistTrack
          .mockReturnValueOnce(track)
          .mockReturnValueOnce(track)
          .mockReturnValue(wrongTrack);
      mockSlackBlocks.contextSection.mockReturnValue(context);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.currently_playing(track.title));
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.context_on(`<${settings.playlist.url}|${settings.playlist.name}>`));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.currently_playing(track.title), [textSection, context]);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully return playing on playlist but returning or recently deleted', async () => {
      const total = {total: tracks[0].items.length};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSlackBlocks.textSection.mockReturnValue(textSection);
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockTrack.mockReturnValueOnce(track); // Status Call
      mockPlaylistTrack.mockReturnValue(wrongTrack);
      mockSlackBlocks.contextSection.mockReturnValue(context);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.currently_playing(track.title));
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, null, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.returning(`<${settings.playlist.url}|${settings.playlist.name}>`));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.currently_playing(track.title), [textSection, context]);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully return not on playlist', async () => {
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSlackBlocks.textSection.mockReturnValue(textSection);
      mockSpotifyHelper.onPlaylist.mockReturnValue(false);
      mockSlackBlocks.contextSection.mockReturnValue(context);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.currently_playing(track.title));
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.context_off(`<${settings.playlist.url}|${settings.playlist.name}>`, false));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.currently_playing(track.title), [textSection, context]);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully return not on playlist without back to playlist prompt', async () => {
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSlackBlocks.textSection.mockReturnValue(textSection);
      mockSpotifyHelper.onPlaylist.mockReturnValue(false);
      mockSlackBlocks.contextSection.mockReturnValue(context);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);

      await expect(mod.handler(event(params[1]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings2, settings2.playlist, status[0], track);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.currently_playing(track.title));
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings2.playlist);
      expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.context_off(`<${settings2.playlist.url}|${settings2.playlist.name}>`, true));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.currently_playing(track.title), [textSection, context]);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully report not playing', async () => {
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(false);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.not_playing, null);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should successfully return when onBlacklist detects something', async () => {
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(true);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
    });

    it('should successfully return not on playlist and afterSkip is true', async () => {
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSlackBlocks.textSection.mockReturnValue(textSection);
      mockSpotifyHelper.onPlaylist.mockReturnValue(false);
      mockSlackBlocks.contextSection.mockReturnValue(context);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockUtilTimeout.sleep.mockResolvedValue();

      await expect(mod.handler(event(params[2]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.currently_playing(track.title));
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings2.playlist);
      expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.context_off(`<${settings2.playlist.url}|${settings2.playlist.name}>`, true));
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.currently_playing(track.title), [textSection, context]);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
      expect(mockUtilTimeout.sleep).toHaveBeenCalledWith(2000);
    });
  });
});
