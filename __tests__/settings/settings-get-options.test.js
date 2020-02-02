const port = 4001;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadDefaultDevice, loadPlaylist, loadProfile} = require('../../server/components/settings/settings-interface');
const {storeDevices, storePlaylists} = require('../../server/components/settings/settings-dal');
const {fetchPlaylists} = require('../../server/components/spotify-api/spotify-api-playlists');
const {fetchDevices} = require('../../server/components/spotify-api/spotify-api-devices');

const {mockFetchPlaylists} = require('../mocks/spotify-api/playlist');
const {mockFetchDevices} = require('../mocks/spotify-api/devices');
const {deviceOptionsPayload, playlistOptionsPayload, timezoneOptionsPayload} = require('../mocks/payloads/slack-options');
const {fullProfile} = require('../mocks/db/settings');

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/settings/settings-dal');
jest.mock('../../server/components/spotify-api/spotify-api-playlists');
jest.mock('../../server/components/slack/slack-api.js');
jest.mock('../../server/components/spotify-api/spotify-api-devices');


beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

describe('Spotbot settings - get playlist options', () => {
  loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
  fetchPlaylists.mockReturnValueOnce(Promise.resolve(mockFetchPlaylists));

  test('should get playlist options for query "test"', async () => {
    const response = await request(server)
        .post('/slack/actions/options')
        .send({payload: playlistOptionsPayload});
    expect(response.status).toEqual(200);
    expect(loadPlaylist).toBeCalled();
    expect(loadProfile).toBeCalled();
    expect(fetchPlaylists).toBeCalled();
    expect(storePlaylists).toBeCalled();
    expect(response.body).toEqual({'option_groups': [{'label': {'text': 'Search Results:', 'type': 'plain_text'}, 'options': [{'text': {'emoji': true, 'text': 'Test', 'type': 'plain_text'}, 'value': '2nuwjAGCHQiPabqGH6SLty'}, {'text': {'emoji': true, 'text': 'Test', 'type': 'plain_text'}, 'value': '099bxvxES7QkJtj4hrejhT'}]}, {'label': {'text': 'Other:', 'type': 'plain_text'}, 'options': [{'text': {'emoji': true, 'text': 'Create a new playlist called "tes"', 'type': 'plain_text'}, 'value': 'create_new_playlist.tes'}]}]});
  });
});

describe('Spotbot settings - get device options', () => {
  loadDefaultDevice.mockReturnValueOnce(Promise.resolve(null));
  fetchDevices.mockReturnValueOnce(Promise.resolve(mockFetchDevices));

  test('should get device options', async () => {
    const response = await request(server)
        .post('/slack/actions/options')
        .send({payload: deviceOptionsPayload});
    expect(response.status).toEqual(200);
    expect(loadDefaultDevice).toBeCalled();
    expect(fetchDevices).toBeCalled();
    expect(storeDevices).toBeCalled();
    expect(response.body).toEqual({'options': [{'text': {'emoji': true, 'text': 'None', 'type': 'plain_text'}, 'value': 'no_devices'}, {'text': {'emoji': true, 'text': 'AU13282 - Computer', 'type': 'plain_text'}, 'value': '87997bb4312981a00f1d8029eb874c55a211a0cc'}]});
  });
});

describe('Spotbot settings - get timezone options', () => {
  test('should get timezone options', async () => {
    const response = await request(server)
        .post('/slack/actions/options')
        .send({payload: timezoneOptionsPayload});
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({'option_groups': [{'label': {'text': '23 queries for "Australia".', 'type': 'plain_text'}, 'options': [{'text': {'emoji': true, 'text': 'Australia/ACT (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/ACT'}, {'text': {'emoji': true, 'text': 'Australia/Adelaide (+10:30)', 'type': 'plain_text'}, 'value': 'Australia/Adelaide'}, {'text': {'emoji': true, 'text': 'Australia/Brisbane (+10:00)', 'type': 'plain_text'}, 'value': 'Australia/Brisbane'}, {'text': {'emoji': true, 'text': 'Australia/Broken_Hill (+10:30)', 'type': 'plain_text'}, 'value': 'Australia/Broken_Hill'}, {'text': {'emoji': true, 'text': 'Australia/Canberra (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/Canberra'}, {'text': {'emoji': true, 'text': 'Australia/Currie (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/Currie'}, {'text': {'emoji': true, 'text': 'Australia/Darwin (+09:30)', 'type': 'plain_text'}, 'value': 'Australia/Darwin'}, {'text': {'emoji': true, 'text': 'Australia/Eucla (+08:45)', 'type': 'plain_text'}, 'value': 'Australia/Eucla'}, {'text': {'emoji': true, 'text': 'Australia/Hobart (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/Hobart'}, {'text': {'emoji': true, 'text': 'Australia/LHI (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/LHI'}, {'text': {'emoji': true, 'text': 'Australia/Lindeman (+10:00)', 'type': 'plain_text'}, 'value': 'Australia/Lindeman'}, {'text': {'emoji': true, 'text': 'Australia/Lord_Howe (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/Lord_Howe'}, {'text': {'emoji': true, 'text': 'Australia/Melbourne (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/Melbourne'}, {'text': {'emoji': true, 'text': 'Australia/NSW (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/NSW'}, {'text': {'emoji': true, 'text': 'Australia/North (+09:30)', 'type': 'plain_text'}, 'value': 'Australia/North'}, {'text': {'emoji': true, 'text': 'Australia/Perth (+08:00)', 'type': 'plain_text'}, 'value': 'Australia/Perth'}, {'text': {'emoji': true, 'text': 'Australia/Queensland (+10:00)', 'type': 'plain_text'}, 'value': 'Australia/Queensland'}, {'text': {'emoji': true, 'text': 'Australia/South (+10:30)', 'type': 'plain_text'}, 'value': 'Australia/South'}, {'text': {'emoji': true, 'text': 'Australia/Sydney (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/Sydney'}, {'text': {'emoji': true, 'text': 'Australia/Tasmania (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/Tasmania'}, {'text': {'emoji': true, 'text': 'Australia/Victoria (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/Victoria'}, {'text': {'emoji': true, 'text': 'Australia/West (+08:00)', 'type': 'plain_text'}, 'value': 'Australia/West'}, {'text': {'emoji': true, 'text': 'Australia/Yancowinna (+10:30)', 'type': 'plain_text'}, 'value': 'Australia/Yancowinna'}]}]});
  });
});


