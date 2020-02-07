const port = 4014;
const server = require('../../server/server')({port});
const request = require('supertest');

const {fetchPlaylistTotal, fetchTracks} = require('../../server/components/spotify-api/spotify-api-playlists');
const {fetchCurrentPlayback} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {loadBackToPlaylist, loadPlaylist} = require('../../server/components/settings/settings-interface');
const {post} = require('../../server/components/slack/slack-api');

Date.now = jest.fn(() => 1580733627881);

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playlists');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/slack/slack-middleware', () => jest.fn(async (ctx, next) => await next()));

const {mockFetchTracksbtp} = require('../mocks/spotify-api/playlist');
const {currentSlashPayload} = require('../mocks/payloads/slash-commands');
const {mockFetchCurrentPlayback, mockFetchCurrentPlaybackOnPlaylist, mockFetchCurrentPlaybackOnPlaylist2} = require('../mocks/spotify-api/playback-status');
const {fullPlaylistSetting} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slash command /current', () => {
  test('should show returning to playlist current playing', async () => {
    fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackOnPlaylist));
    fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 8}}));
    fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracksbtp));
    const response = await request(server)
        .post('/tracks/current')
        .send(currentSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(fetchPlaylistTotal).toBeCalled();
    expect(fetchTracks).toBeCalled();
    expect(post).toBeCalledWith({'blocks': [{'text': {'text': ':sound: Currently playing The Jungle Giants - Feel the Way I Do.', 'type': 'mrkdwn'}, 'type': 'section'}, {'elements': [{'text': ':information_source: Spotbot is returning to the Spotbot playlist: <<https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty|Test>>. The next song will be back on the playlist.', 'type': 'mrkdwn'}], 'type': 'context'}], 'channel': 'CRVUTDP47', 'text': ':sound: Currently playing The Jungle Giants - Feel the Way I Do.'});
  });
});

describe('Slash command /current', () => {
  test('should show on playlist', async () => {
    fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackOnPlaylist2));
    fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 9}}));
    fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracksbtp));
    const response = await request(server)
        .post('/tracks/current')
        .send(currentSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(fetchPlaylistTotal).toBeCalled();
    expect(fetchTracks).toBeCalled();
    expect(post).toBeCalledWith({'blocks': [{'text': {'text': ':sound: Currently playing Crooked Colours - Do It Like You.', 'type': 'mrkdwn'}, 'type': 'section'}, {'elements': [{'text': ':information_source: Playing from the Spotbot playlist: <https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty|Test>. Track 9 of 9.', 'type': 'mrkdwn'}], 'type': 'context'}], 'channel': 'CRVUTDP47', 'text': ':sound: Currently playing Crooked Colours - Do It Like You.'});
  });
});

describe('Slash command /current', () => {
  test('should show playing off', async () => {
    fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
    fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 9}}));
    fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracksbtp));
    const response = await request(server)
        .post('/tracks/current')
        .send(currentSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(post).toBeCalledWith({'blocks': [{'text': {'text': ':sound: Currently playing Crooked Colours - Do It Like You.', 'type': 'mrkdwn'}, 'type': 'section'}, {'elements': [{'text': ':information_source: Not playing from the Spotbot playlist: <https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty|Test>. ', 'type': 'mrkdwn'}], 'type': 'context'}], 'channel': 'CRVUTDP47', 'text': ':sound: Currently playing Crooked Colours - Do It Like You.'});
  });
});

describe('Slash command /current', () => {
  test('should show playing off with back to playlist tip', async () => {
    fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
    fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 9}}));
    fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracksbtp));
    loadBackToPlaylist.mockReturnValueOnce(Promise.resolve('true'));
    const response = await request(server)
        .post('/tracks/current')
        .send(currentSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(loadBackToPlaylist).toBeCalled();
    expect(post).toBeCalledWith({'blocks': [{'text': {'text': ':sound: Currently playing Crooked Colours - Do It Like You.', 'type': 'mrkdwn'}, 'type': 'section'}, {'elements': [{'text': ':information_source: Not playing from the Spotbot playlist: <https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty|Test>.  Spotbot will return when you add songs to the playlist.', 'type': 'mrkdwn'}], 'type': 'context'}], 'channel': 'CRVUTDP47', 'text': ':sound: Currently playing Crooked Colours - Do It Like You.'});
  });
});
