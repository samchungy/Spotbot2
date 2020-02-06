const port = 4017;
const server = require('../../server/server')({port});
const request = require('supertest');

const {fetchCurrentPlayback} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {transferDevice} = require('../../server/components/spotify-api/spotify-api-playback');
const {fetchDevices} = require('../../server/components/spotify-api/spotify-api-devices');
const {loadAdmins, loadDefaultDevice, loadPlaylist} = require('../../server/components/settings/settings-interface');
const {post, postEphemeral, sendModal} = require('../../server/components/slack/slack-api');

Date.now = jest.fn(() => 1580733627881);

jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/spotify-api/spotify-api-tracks');
jest.mock('../../server/components/settings/blacklist/blacklist-dal');
jest.mock('../../server/components/control/control-dal');
jest.mock('../../server/components/spotify-api/spotify-api-devices');

const {mockFetchCurrentPlayback} = require('../mocks/spotify-api/playback-status');
const {mockFetchDevices} = require('../mocks/spotify-api/devices');
const {devicePayload} = require('../mocks/payloads/slack-actions');
const {deviceSlashPayload} = require('../mocks/payloads/slash-commands');
const {fullPlaylistSetting, fullDefaultDevice} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));
loadAdmins.mockReturnValue(Promise.resolve(['URVUTD7UP']));

describe('Slash command /spotbot device', () => {
  test('should open a slack modal for devices', async () => {
    fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevices));
    loadDefaultDevice.mockReturnValueOnce(Promise.resolve(fullDefaultDevice));
    fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
    const response = await request(server)
        .post('/settings')
        .send(deviceSlashPayload);
    expect(response.status).toEqual(200);
    expect(loadPlaylist).toBeCalled();
    expect(fetchDevices).toBeCalled();
    expect(loadDefaultDevice).toBeCalled();
    expect(fetchCurrentPlayback).toBeCalled();
    expect(sendModal).toBeCalledWith('920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3', {'type': 'modal', 'callback_id': 'device_modal', 'title': {'type': 'plain_text', 'text': 'Spotify Devices', 'emoji': true}, 'submit': {'type': 'plain_text', 'text': 'Switch to Device', 'emoji': true}, 'close': {'type': 'plain_text', 'text': 'Cancel', 'emoji': true}, 'blocks': [{'type': 'section', 'text': {'type': 'mrkdwn', 'text': 'Spotbot will try to keep playing on the current device despite what the default device is set as in the settings. When Spotify is not reporting a device, Spotbot will attempt to fallback onto the default. To change the default, please go to `/spotbot settings`.\n\n *Current Default Device:* AU13282 - Computer'}}, {'type': 'input', 'label': {'type': 'plain_text', 'text': 'Select a device'}, 'hint': {'type': 'plain_text', 'text': 'The device which you will be playing music through'}, 'block_id': 'device_modal', 'element': {'action_id': 'device_modal', 'type': 'static_select', 'options': [{'text': {'type': 'plain_text', 'text': 'Current Device: AU13282 - Computer', 'emoji': true}, 'value': '87997bb4312981a00f1d8029eb874c55a211a0cc'}], 'initial_option': {'text': {'type': 'plain_text', 'text': 'Current Device: AU13282 - Computer', 'emoji': true}, 'value': '87997bb4312981a00f1d8029eb874c55a211a0cc'}}}], 'private_metadata': 'CRVUTDP47'});
  });
});

describe('Slash command /spotbot device', () => {
  test('should open a slack modal for devices', async () => {
    fetchDevices.mockReturnValueOnce(Promise.resolve({devices: []}));
    const response = await request(server)
        .post('/settings')
        .send(deviceSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchDevices).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': ':information_source: No devices currently open.', 'user': 'URVUTD7UP'});
  });
});

describe('submit device select', () => {
  test('should submit a device', async () => {
    fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevices));
    fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(null));
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: devicePayload});
    expect(response.status).toEqual(200);
    expect(loadPlaylist).toBeCalled();
    expect(fetchDevices).toBeCalled();
    expect(fetchCurrentPlayback).toBeCalled();
    expect(transferDevice).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': ':arrows_clockwise: Playback on Spotbot was switched to AU13282 - Computer by <@URVUTD7UP>.'});
  });
});
