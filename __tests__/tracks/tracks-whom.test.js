const port = 4013;
const server = require('../../server/server')({port});
const request = require('supertest');

const {fetchUserProfile} = require('../../server/components/spotify-api/spotify-api-profile');
const {fetchPlaylistTotal, fetchTracks} = require('../../server/components/spotify-api/spotify-api-playlists');
const {fetchCurrentPlayback} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {loadPlaylist, loadProfile} = require('../../server/components/settings/settings-interface');
const {post} = require('../../server/components/slack/slack-api');
const {loadSearch} = require('../../server/components/tracks/tracks-dal');

Date.now = jest.fn(() => 1580897513263);

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playlists');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/tracks/tracks-dal');
jest.mock('../../server/components/spotify-api/spotify-api-profile');

const {mockFetchWhomTracks, mockFetchTracks} = require('../mocks/spotify-api/playlist');
const {whomSlashCommand} = require('../mocks/payloads/slash-commands');
const {mockFetchCurrentPlaybackOnPlaylist} = require('../mocks/spotify-api/playback-status');
const {mockFetchProfile} = require('../mocks/spotify-api/profile');
const {fullPlaylistSetting, fullProfile} = require('../mocks/db/settings');
const {fullHistoryJungle} = require('../mocks/db/search');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slash command /whom', () => {
  loadSearch.mockReturnValueOnce(Promise.resolve(fullHistoryJungle));
  loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
  fetchUserProfile.mockReturnValueOnce(Promise.resolve(mockFetchProfile));
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackOnPlaylist));
  fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchWhomTracks));
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 9}}));
  test('should shpw added by a particular slack user', async () => {
    const response = await request(server)
        .post('/tracks/whom')
        .send(whomSlashCommand);
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(fetchCurrentPlayback).toBeCalled();
    expect(fetchPlaylistTotal).toBeCalled();
    expect(fetchTracks).toBeCalled();
    expect(fetchUserProfile).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': ':microphone: The Jungle Giants - Feel the Way I Do was added was last added in 9 minutes by <@URVUTD7UP>.'});
  });
});

describe('Slash command /whom', () => {
  loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackOnPlaylist));
  fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracks));
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 9}}));
  test('should show returning to playlist current playing', async () => {
    const response = await request(server)
        .post('/tracks/whom')
        .send(whomSlashCommand);
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(fetchCurrentPlayback).toBeCalled();
    expect(fetchPlaylistTotal).toBeCalled();
    expect(fetchTracks).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': ':microphone: The Jungle Giants - Feel the Way I Do is playing because Spotbot is returning to the playlist. The next song will be back on the playlist.'});
  });
});

describe('Slash command /whom', () => {
  loadSearch.mockReturnValueOnce(Promise.resolve(null));
  loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackOnPlaylist));
  fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchWhomTracks));
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 9}}));
  fetchUserProfile.mockReturnValueOnce(Promise.resolve(mockFetchProfile));
  test('should show returning to playlist current playing', async () => {
    const response = await request(server)
        .post('/tracks/whom')
        .send(whomSlashCommand);
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(loadSearch).toBeCalled();
    expect(fetchCurrentPlayback).toBeCalled();
    expect(fetchPlaylistTotal).toBeCalled();
    expect(fetchUserProfile).toBeCalled();
    expect(fetchTracks).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': ':microphone: The Jungle Giants - Feel the Way I Do was added directly to the playlist in Spotify in 9 minutes by <https://open.spotify.com/user/samchungy|Sam Chung>.'});
  });
});
