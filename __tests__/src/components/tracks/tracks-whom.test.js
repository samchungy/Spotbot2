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
const mockMoment = {
  tz: jest.fn(),
  format: jest.fn(),
  names: jest.fn(),
  unix: jest.fn(),
  fromNow: jest.fn(),
};
const mockMom = jest.fn(() => mockMoment);
mockMom.unix = jest.fn(() => mockMoment);
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
const mockSpotifyProfile = {
  fetchUserProfile: jest.fn(),
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
const mockSkip = {
  onBlacklist: jest.fn(),
};
const mockHistory = {
  loadTrackHistory: jest.fn(),
};

jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-devices', () => mockSpotifyDevices, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback-status', () => mockSpotifyStatus, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback', () => mockSpotifyPlayback, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-profile', () => mockSpotifyProfile, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-helper', () => mockSpotifyHelper, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-playlist-track', () => mockPlaylistTrack, {virtual: true});
jest.mock('/opt/spotify/spotify-objects/util-spotify-track', () => mockTrack, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackBlocks, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});

jest.mock('/opt/control-skip/control-skip', () => mockSkip, {virtual: true});

jest.mock('/opt/db/history-interface', () => mockHistory, {virtual: true});

const mod = require('../../../../src/components/tracks/tracks-whom');
const response = mod.RESPONSE;
const {teamId, channelId, settings} = require('../../../data/request');
const status = require('../../../data/spotify/status');
const tracks = require('../../../data/spotify/tracks');
const profiles = require('../../../data/spotify/profile');
const params = {
  0: {teamId, channelId, settings},
};
const event = (params) => ({
  Records: [{Sns: {Message: JSON.stringify(params)}}],
});

describe('Tracks Whom', () => {
  const profile = {country: 'AU', id: 'spotify user id'};
  const auth = {auth: true, getProfile: () => profile};

  describe('Handler', () => {
    it('should return successfully', async () => {
      mockAuthSession.authSession.mockResolvedValue(auth);
      await expect(mod.handler(event(params[0]))).resolves.toBe();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error();
      mockAuthSession.authSession.mockRejectedValue(error);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockLogger.error).toHaveBeenCalledWith(error, response.failed);
      expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(channelId, null, response.failed);
    });
  });

  describe('main', () => {
    beforeEach(() => {
      mockMom.mockImplementation(() => mockMoment);
      mockMom.unix.mockImplementation(() => mockMoment);
      mockSns.publish.mockReturnThis();
    });
    const total = {total: tracks[0].items.length};
    const post = {inChannelPost: true};
    const wrongTrack = {id: 'not it', uri: 'not the uri', title: 'another song title'};
    it('should detect that a slack user added a song', async () => {
      const history = {
        'timeAdded': 1598004748,
        'artistsIds': [
          '6yrtCy4XJHXM6tczo4RlTs',
        ],
        'team_channel': 'TRVUTD7DM-CRU3H4MEC',
        'id': '2BrsEZqObLdNQEh6degzqS',
        'numAdds': 6,
        'ttl': 1600683148,
        'userId': 'URVUTD7UP',
      };
      const track = {id: 'id', uri: 'uri', title: 'song title', addedBy: {id: profile.id}};
      const from = '10 minutes ago';

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack
          .mockReturnValueOnce(track)
          .mockReturnValue(wrongTrack);
      mockHistory.loadTrackHistory.mockResolvedValue(history);
      mockMoment.unix.mockReturnThis();
      mockMoment.fromNow.mockReturnValue(from);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, profile.country, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockHistory.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, track.id);
      expect(mockMom.unix).toHaveBeenCalledWith(history.timeAdded);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.now_playing(track.title, `<@${history.userId}>`, from), null);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should detect that a slack user did not add a song, use spotify display name', async () => {
      const track = {id: 'id', uri: 'uri', title: 'song title', addedBy: {id: profile.id}, addedAt: 'date'};
      const from = '10 minutes ago';

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack
          .mockReturnValueOnce(track)
          .mockReturnValue(wrongTrack);
      mockHistory.loadTrackHistory.mockResolvedValue(null);
      mockSpotifyProfile.fetchUserProfile.mockResolvedValue(profiles[0]);
      mockMoment.unix.mockReturnThis();
      mockMoment.fromNow.mockReturnValue(from);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, profile.country, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockHistory.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, track.id);
      expect(mockSpotifyProfile.fetchUserProfile).toHaveBeenCalledWith(auth, track.addedBy.id);
      expect(mockMom).toHaveBeenCalledWith(track.addedAt);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.now_playing_direct(track.title, `<${profiles[0].external_urls.spotify}|${profiles[0].display_name}>`, from), null);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should detect that the accounts spotify account did not add the song', async () => {
      const track = {id: 'id', uri: 'uri', title: 'song title', addedBy: {id: 'not id'}, addedAt: 'date'};
      const from = '10 minutes ago';

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack
          .mockReturnValueOnce(track)
          .mockReturnValue(wrongTrack);
      mockHistory.loadTrackHistory.mockResolvedValue(null);
      mockSpotifyProfile.fetchUserProfile.mockResolvedValue(profiles[0]);
      mockMoment.unix.mockReturnThis();
      mockMoment.fromNow.mockReturnValue(from);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, profile.country, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSpotifyProfile.fetchUserProfile).toHaveBeenCalledWith(auth, track.addedBy.id);
      expect(mockMom).toHaveBeenCalledWith(track.addedAt);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.now_playing_direct(track.title, `<${profiles[0].external_urls.spotify}|${profiles[0].display_name}>`, from), null);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should detect that a slack user did not add a song, use spotify id', async () => {
      const track = {id: 'id', uri: 'uri', title: 'song title', addedBy: {id: profile.id}, addedAt: 'date'};
      const from = '10 minutes ago';

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack
          .mockReturnValueOnce(track)
          .mockReturnValue(wrongTrack);
      mockHistory.loadTrackHistory.mockResolvedValue(null);
      mockSpotifyProfile.fetchUserProfile.mockResolvedValue(profiles[1]);
      mockMoment.unix.mockReturnThis();
      mockMoment.fromNow.mockReturnValue(from);
      mockSlackFormatReply.inChannelPost.mockReturnValue(post);
      mockSlackApi.post.mockResolvedValue();

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, profile.country, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockHistory.loadTrackHistory).toHaveBeenCalledWith(teamId, channelId, track.id);
      expect(mockSpotifyProfile.fetchUserProfile).toHaveBeenCalledWith(auth, track.addedBy.id);
      expect(mockMom).toHaveBeenCalledWith(track.addedAt);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.now_playing_direct(track.title, `<${profiles[1].external_urls.spotify}|${profiles[1].id}>`, from), null);
      expect(mockSlackApi.post).toHaveBeenCalledWith(post);
    });

    it('should detect that the song is on the playlist and get current track to run', async () => {
      const track = {id: 'id', uri: 'uri', title: 'song title', addedBy: {id: profile.id}};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSpotifyHelper.onPlaylist.mockReturnValue(true);
      mockSpotifyPlaylists.fetchPlaylistTotal.mockResolvedValue(total);
      mockSpotifyPlaylists.fetchTracks.mockResolvedValue(tracks[0]);
      mockPlaylistTrack
          .mockReturnValue(wrongTrack);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSpotifyPlaylists.fetchPlaylistTotal).toHaveBeenCalledWith(auth, settings.playlist.id);
      expect(mockSpotifyPlaylists.fetchTracks).toHaveBeenCalledWith(auth, settings.playlist.id, profile.country, 0);
      tracks[0].items.forEach((t) => expect(mockPlaylistTrack).toHaveBeenCalledWith(t));
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings}),
        TopicArn: process.env.SNS_PREFIX + 'tracks-current',
      });
    });

    it('should detect that the song is not on the playlist and get current track to run', async () => {
      const track = {id: 'id', uri: 'uri', title: 'song title', addedBy: {id: profile.id}};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(false);
      mockSpotifyHelper.onPlaylist.mockReturnValue(false);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
      expect(mockSpotifyHelper.onPlaylist).toHaveBeenCalledWith(status[0], settings.playlist);
      expect(mockSns.publish).toHaveBeenCalledWith({
        Message: JSON.stringify({teamId, channelId, settings}),
        TopicArn: process.env.SNS_PREFIX + 'tracks-current',
      });
    });

    it('should detect that the song is on the blacklist', async () => {
      const track = {id: 'id', uri: 'uri', title: 'song title', addedBy: {id: profile.id}};

      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyStatus.fetchCurrentPlayback.mockResolvedValue(status[0]);
      mockSpotifyHelper.isPlaying.mockReturnValue(true);
      mockTrack.mockReturnValue(track);
      mockSkip.onBlacklist.mockResolvedValue(true);

      await expect(mod.handler(event(params[0]))).resolves.toBe();
      expect(mockAuthSession.authSession).toHaveBeenCalledWith(teamId, channelId);
      expect(mockSpotifyStatus.fetchCurrentPlayback).toHaveBeenCalledWith(auth, profile.country);
      expect(mockSpotifyHelper.isPlaying).toHaveBeenCalledWith(status[0]);
      expect(mockTrack).toHaveBeenCalledWith(status[0].item);
      expect(mockSkip.onBlacklist).toHaveBeenCalledWith(teamId, channelId, auth, settings, settings.playlist, status[0], track);
    });
  });
});
