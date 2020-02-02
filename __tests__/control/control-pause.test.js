const port = 4006;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadPlaylist} = require('../../server/components/settings/settings-interface');
const {pause} = require('../../server/components/spotify-api/spotify-api-playback');
const {fetchDevices} = require('../../server/components/spotify-api/spotify-api-devices');
const {fetchCurrentPlayback} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {updatePanel} = require('../../server/components/control/control-panel');
const {PAUSE_RESPONSE} = require('../../server/components/control/control-pause');
const {post} = require('../../server/components/slack/slack-api');

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/spotify-api/spotify-api-devices');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/control/control-panel');
jest.mock('../../server/util/util-timeout');
jest.mock('../../server/components/slack/slack-api');

const {pauseSlashPayload} = require('../mocks/payloads/slash-commands');
const {mockFetchCurrentPlayback, mockFetchCurrentPlaybackPaused} = require('../mocks/spotify-api/playback-status');
const {mockFetchDevicesNone, mockFetchDevices} = require('../mocks/spotify-api/devices');
const {fullPlaylistSetting} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slash Command: /pause', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackPaused));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevicesNone));

  test('should return no open device', async () => {
    const response = await request(server)
        .post('/control/pause/')
        .send(pauseSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(updatePanel).toBeCalledWith(pauseSlashPayload.team_id, pauseSlashPayload.channel_id, null, PAUSE_RESPONSE.no_devices, expect.anything());
  });
});

describe('Slash Command: /pause', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackPaused));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevices));

  test('should return already paused', async () => {
    const response = await request(server)
        .post('/control/pause/')
        .send(pauseSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(updatePanel).toBeCalledWith(pauseSlashPayload.team_id, pauseSlashPayload.channel_id, null, PAUSE_RESPONSE.already, expect.anything());
  });
});

describe('Slash Command: /pause', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevices));
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlaybackPaused));


  test('should pause playback', async () => {
    const response = await request(server)
        .post('/control/pause/')
        .send(pauseSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalledTimes(2);
    expect(pause).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': pauseSlashPayload.channel_id, 'text': PAUSE_RESPONSE.success(pauseSlashPayload.user_id)});
  });
});


