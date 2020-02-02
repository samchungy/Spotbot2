const port = 4005;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadDefaultDevice, loadPlaylist} = require('../../server/components/settings/settings-interface');
const {play} = require('../../server/components/spotify-api/spotify-api-playback');
const {fetchDevices} = require('../../server/components/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {PLAY_RESPONSE} = require('../../server/components/control/control-play');
const {updatePanel} = require('../../server/components/control/control-panel');
const {post} = require('../../server/components/slack/slack-api');

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/spotify-api/spotify-api-devices');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/control/control-panel');
jest.mock('../../server/util/util-timeout');

const {playSlashPayload} = require('../mocks/payloads/slash-commands');
const {mockFetchCurrentPlayback, mockFetchCurrentPlaybackPaused} = require('../mocks/spotify-api/playback-status');
const {mockFetchDevicesNone} = require('../mocks/spotify-api/devices');
const {fullPlaylistSetting, fullDefaultDevice, fullDefaultDeviceNone} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slash Command: /play', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));

  test('should open an already playing panel', async () => {
    const response = await request(server)
        .post('/control/play/')
        .send(playSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(updatePanel).toBeCalledWith(playSlashPayload.team_id, playSlashPayload.channel_id, null, PLAY_RESPONSE.already, expect.anything());
  });
});

describe('Slash Command: /play', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve({}));
  loadDefaultDevice.mockReturnValueOnce(Promise.resolve(fullDefaultDevice));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevicesNone));
  test('should return no default device', async () => {
    const response = await request(server)
        .post('/control/play/')
        .send(playSlashPayload);
    expect(response.status).toEqual(200);
    expect(loadDefaultDevice).toBeCalled();
    expect(fetchDevices).toBeCalled();
    expect(fetchCurrentPlayback).toBeCalled();
    expect(updatePanel).toBeCalledWith(playSlashPayload.team_id, playSlashPayload.channel_id, null, PLAY_RESPONSE.no_device, expect.anything());
  });
});

describe('Slash Command: /play', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve({}));
  loadDefaultDevice.mockReturnValueOnce(Promise.resolve(fullDefaultDeviceNone));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevicesNone));
  test('should return no devices', async () => {
    const response = await request(server)
        .post('/control/play/')
        .send(playSlashPayload);
    expect(response.status).toEqual(200);
    expect(loadDefaultDevice).toBeCalled();
    expect(fetchDevices).toBeCalled();
    expect(fetchCurrentPlayback).toBeCalled();
    expect(updatePanel).toBeCalledWith(playSlashPayload.team_id, playSlashPayload.channel_id, null, PLAY_RESPONSE.no_devices, expect.anything());
  });
});


describe('Slash Command: /play', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackPaused));
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevicesNone));
  test('should open start playback using current device', async () => {
    const response = await request(server)
        .post('/control/play/')
        .send(playSlashPayload);
    expect(response.status).toEqual(200);
    expect(play).toBeCalled();
    expect(fetchCurrentPlayback).toBeCalledTimes(2);
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': playSlashPayload.channel_id, 'text': PLAY_RESPONSE.success(playSlashPayload.user_id)});
  });
});
