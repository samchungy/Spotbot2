const port = 4007;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadPlaylist} = require('../../server/components/settings/settings-interface');
const {play} = require('../../server/components/spotify-api/spotify-api-playback');
const {fetchPlaylistTotal} = require('../../server/components/spotify-api/spotify-api-playlists');
const {fetchCurrentPlayback} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {updatePanel} = require('../../server/components/control/control-panel');
const {JUMP_RESPONSE} = require('../../server/components/control/control-jump');
const {post} = require('../../server/components/slack/slack-api');

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/spotify-api/spotify-api-playlists');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/control/control-panel');
jest.mock('../../server/util/util-timeout');
jest.mock('../../server/components/slack/slack-api');

const {jumpPayload} = require('../mocks/payloads/slack-actions');
const {mockFetchCurrentPlayback, mockFetchCurrentPlaybackOnPlaylist} = require('../mocks/spotify-api/playback-status');
const {fullPlaylistSetting} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slack Action - Click Jump to Start of Playlist button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve({}));

  test('should return not playing', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: jumpPayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(updatePanel).toBeCalledWith(expect.anything(), expect.anything(), '1580625619.001200', JUMP_RESPONSE.not_playing, expect.anything());
  });
});

describe('Slack Action - Click Jump to Start of Playlist button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 0}}));

  test('should return empty playlist', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: jumpPayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(updatePanel).toBeCalledWith(expect.anything(), expect.anything(), '1580625619.001200', JUMP_RESPONSE.empty, expect.anything());
  });
});

describe('Slack Action - Click Jump to Start of Playlist button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 10}}));
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackOnPlaylist));

  test('should successfully return to playlist', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: jumpPayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalledTimes(2);
    expect(play).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': expect.anything(), 'text': JUMP_RESPONSE.success('URVUTD7UP')});
  });
});
