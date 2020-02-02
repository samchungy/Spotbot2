const port = 4010;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadPlaylist} = require('../../server/components/settings/settings-interface');
const {fetchDevices} = require('../../server/components/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {shuffle, repeat} = require('../../server/components/spotify-api/spotify-api-playback');
const {updatePanel} = require('../../server/components/control/control-panel');
const {REPEAT_RESPONSE, SHUFFLE_RESPONSE} = require('../../server/components/control/control-shuffle-repeat');
const {post} = require('../../server/components/slack/slack-api');

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/spotify-api/spotify-api-devices');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/control/control-panel');
jest.mock('../../server/util/util-timeout');
jest.mock('../../server/components/slack/slack-api');

const {repeatPayload, shufflePayload} = require('../mocks/payloads/slack-actions');
const {mockFetchCurrentPlayback, mockFetchCurrentPlaybackShuffle, mockFetchCurrentPlaybackRepeat} = require('../mocks/spotify-api/playback-status');
const {mockFetchDevicesNone} = require('../mocks/spotify-api/devices');
const {fullPlaylistSetting} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slack action: toggle shuffle button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve({}));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevicesNone));

  test('should return not playing', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: shufflePayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(updatePanel).toBeCalledWith('TRVUTD7DM', 'CRVUTDP47', '1580639999.001400', SHUFFLE_RESPONSE.not_playing, {});
  });
});

describe('Slack action: toggle shuffle button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevicesNone));

  test('should return not playing', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: shufflePayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(shuffle).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': SHUFFLE_RESPONSE.on('URVUTD7UP')});
  });
});

describe('Slack action: toggle shuffle button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackShuffle));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevicesNone));

  test('should return not playing', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: shufflePayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(shuffle).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': SHUFFLE_RESPONSE.off('URVUTD7UP')});
  });
});

describe('Slack action: toggle repeat button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve({}));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevicesNone));

  test('should return not playing', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: repeatPayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(updatePanel).toBeCalledWith('TRVUTD7DM', 'CRVUTDP47', '1580639999.001400', REPEAT_RESPONSE.not_playing, {});
  });
});

describe('Slack action: toggle repeat button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevicesNone));

  test('should return not playing', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: repeatPayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(repeat).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': REPEAT_RESPONSE.on('URVUTD7UP')});
  });
});

describe('Slack action: toggle repeat button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackRepeat));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevicesNone));

  test('should return not playing', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: repeatPayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(repeat).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': REPEAT_RESPONSE.off('URVUTD7UP')});
  });
});
