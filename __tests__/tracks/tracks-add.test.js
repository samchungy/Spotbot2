const port = 4012;
const server = require('../../server/server')({port});
const request = require('supertest');

const {addTracksToPlaylist, deleteTracks, fetchPlaylistTotal, fetchTracks} = require('../../server/components/spotify-api/spotify-api-playlists');
const {fetchTrackInfo} = require('../../server/components/spotify-api/spotify-api-tracks');
const {fetchCurrentPlayback} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {play} = require('../../server/components/spotify-api/spotify-api-playback');
const {loadBackToPlaylistState, loadBackToPlaylist, loadPlaylist, loadProfile, loadRepeat, storeBackToPlaylistState} = require('../../server/components/settings/settings-interface');
const {loadSearch, storeSearch} = require('../../server/components/tracks/tracks-dal');
const {post} = require('../../server/components/slack/slack-api');
const {TRACK_ADD_RESPONSE} = require('../../server/components/tracks/tracks-add');
const {loadBlacklist} = require('../../server/components/settings/blacklist/blacklist-dal');

Date.now = jest.fn(() => 1580733627881);

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playlists');
jest.mock('../../server/components/spotify-api/spotify-api-search');
jest.mock('../../server/components/spotify-api/spotify-api-devices');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/control/control-panel');
jest.mock('../../server/util/util-timeout');
jest.mock('../../server/components/tracks/tracks-dal');
jest.mock(('../../server/components/spotify-api/spotify-api-tracks'));
jest.mock('../../server/components/settings/blacklist/blacklist-dal');
jest.mock('../../server/components/slack/slack-middleware', () => jest.fn(async (ctx, next) => await next()));

const {mockFetchTracks, mockFetchTracksbtp} = require('../mocks/spotify-api/playlist');
const {mockFetchRobbery} = require('../mocks/spotify-api/tracks');
const {mockFetchCurrentPlayback} = require('../mocks/spotify-api/playback-status');
const {addPayload} = require('../mocks/payloads/slack-actions');
const {fullHistory} = require('../mocks/db/search');
const {limeBlacklist} = require('../mocks/db/blacklist');
const {fullPlaylistSetting, fullProfile} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slack Action Add Track', () => {
  test('should add track to playlist', async () => {
    loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
    fetchTrackInfo.mockReturnValueOnce(Promise.resolve(mockFetchRobbery));
    loadBlacklist.mockReturnValueOnce(Promise.resolve([]));
    loadSearch.mockReturnValueOnce(Promise.resolve(fullHistory));
    loadBackToPlaylist.mockReturnValueOnce(Promise.resolve('false'));
    const response = await request(server)
        .post('/slack/actions/')
        .send({payload: addPayload});
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(fetchTrackInfo).toBeCalled();
    expect(loadBlacklist).toBeCalled();
    expect(loadSearch).toBeCalled();
    expect(loadBackToPlaylist).toBeCalled();
    expect(storeSearch).toBeCalled();
    expect(addTracksToPlaylist).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': TRACK_ADD_RESPONSE.success(`Lime Cordiale - Robbery`)});
  });
});

describe('Slack Action Add Track - repeat', () => {
  test('should be stopped by repeat', async () => {
    loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
    fetchTrackInfo.mockReturnValueOnce(Promise.resolve(mockFetchRobbery));
    loadBlacklist.mockReturnValueOnce(Promise.resolve([]));
    loadSearch.mockReturnValueOnce(Promise.resolve(fullHistory));
    loadRepeat.mockReturnValueOnce(Promise.resolve('3'));
    const response = await request(server)
        .post('/slack/actions/')
        .send({payload: addPayload});
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(fetchTrackInfo).toBeCalled();
    expect(loadBlacklist).toBeCalled();
    expect(loadSearch).toBeCalled();
    expect(loadRepeat).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': ':no_entry_sign: Lime Cordiale - Robbery was already added an hour ago. Repeats are disabled for 3 hours in this channel\'s settings.'});
  });
});

describe('Slack Action Add Track - blacklist', () => {
  test('should be stopped by blacklist', async () => {
    loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
    fetchTrackInfo.mockReturnValueOnce(Promise.resolve(mockFetchRobbery));
    loadBlacklist.mockReturnValueOnce(Promise.resolve(limeBlacklist));
    const response = await request(server)
        .post('/slack/actions/')
        .send({payload: addPayload});
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(fetchTrackInfo).toBeCalled();
    expect(loadBlacklist).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': ':no_entry_sign: Lime Cordiale - Robbery is blacklisted and cannot be added.'});
  });
});

describe('Slack Action Add Track back to playlistt', () => {
  test('should add tracks to playlist, go back to playlist and remove the first track', async () => {
    loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
    fetchTrackInfo.mockReturnValueOnce(Promise.resolve(mockFetchRobbery));
    loadBlacklist.mockReturnValueOnce(Promise.resolve([]));
    loadSearch.mockReturnValueOnce(Promise.resolve(fullHistory));
    loadBackToPlaylist.mockReturnValueOnce(Promise.resolve('true'));
    loadBackToPlaylistState.mockReturnValueOnce(Promise.resolve(1580609599671));
    fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback)).mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
    fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 8}})).mockReturnValueOnce(Promise.resolve({tracks: {total: 8}}));
    fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracks)).mockReturnValueOnce(Promise.resolve(mockFetchTracksbtp));

    const response = await request(server)
        .post('/slack/actions/')
        .send({payload: addPayload});
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(fetchTrackInfo).toBeCalled();
    expect(loadBlacklist).toBeCalled();
    expect(loadSearch).toBeCalled();
    expect(loadBackToPlaylist).toBeCalled();
    expect(loadBackToPlaylistState).toBeCalled();
    expect(storeBackToPlaylistState).toBeCalled();
    expect(fetchCurrentPlayback).toBeCalledTimes(2);
    expect(fetchPlaylistTotal).toBeCalledTimes(2);
    expect(fetchTracks).toBeCalledTimes(2);
    expect(deleteTracks).toBeCalledTimes(2);
    expect(addTracksToPlaylist).toBeCalled();
    expect(storeSearch).toBeCalled();
    expect(play).toBeCalled();

    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': TRACK_ADD_RESPONSE.success_back(`Lime Cordiale - Robbery`)});
  });
});
