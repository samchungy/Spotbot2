const port = 4002;
const server = require('../../server/server')({port});
const request = require('supertest');

const {fetchTokens} = require('../../server/components/spotify-api/spotify-api-auth');
const {fetchProfile} = require('../../server/components/spotify-api/spotify-api-profile');
const {loadState, loadView, storeTokens, storeView} = require('../../server/components/settings/spotifyauth/spotifyauth-dal');
const {storeDefaultDevice, storePlaylist, storeProfile} = require('../../server/components/settings/settings-interface');
const {updateView} = require('../../server/components/settings/settings-controller');

jest.mock('../../server/components/settings/spotifyauth/spotifyauth-dal');
jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-profile');
jest.mock('../../server/components/spotify-api/spotify-api-auth');
jest.mock('../../server/components/settings/settings-controller');
jest.mock('../../server/components/slack/slack-middleware', () => jest.fn(async (ctx, next) => await next()));


const {authUrlPayload, reauthPayload} = require('../mocks/payloads/slack-actions');
const {mockFetchTokens} = require('../mocks/spotify-api/auth');
const {mockFetchProfile} = require('../mocks/spotify-api/profile');
const {fullState, fullView} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

fetchProfile.mockReturnValue(Promise.resolve(mockFetchProfile));
fetchTokens.mockReturnValue(Promise.resolve(mockFetchTokens));
loadView.mockReturnValue(Promise.resolve(fullView));

describe('Spotbot auth - click auth button', () => {
  test('should send triggerId and viewId for us to save', async () => {
    const response = await request(server)
        .post('/slack/actions/')
        .send({payload: authUrlPayload});
    expect(response.status).toEqual(200);
    expect(storeView).toBeCalledWith('TRVUTD7DM', 'CRTKGH71S', {'triggerId': '934269632502.879979449463.5a2e4bce11941fe280ab0f8f2a044acf', 'viewId': 'VTG7XHUKY'});
  });
});

describe('Spotbot reauth - click reauth button', () => {
  test('should send an updateModal', async () => {
    const response = await request(server)
        .post('/slack/actions/')
        .send({payload: reauthPayload});
    expect(response.status).toEqual(200);
    expect(storeTokens).toBeCalled();
    expect(storeDefaultDevice).toBeCalled();
    expect(storePlaylist).toBeCalled();
    expect(updateView).toBeCalled();
  });
});

describe('Spotbot auth - callback from Spotify oauth', () => {
  loadState.mockReturnValueOnce(Promise.resolve(fullState));
  test('should send triggerId and viewId for us to save', async () => {
    const response = await request(server)
        .get('/settings/auth/callback?code=AQDGzePSlosx4mzps4-6EnGmBgo48Uc37y8c63sBj3QTKZntcZ7lcmkB93B_c1ihQxBzfxMP2vLOY4iPvy2V-ROmhJdmElTdfz89sbVcztL55JYIUtwQP0-cU0MIQl6_eBtpvuufTyTTMimoBUNc2rFAH8qf_E7VwXhYZNf-bA117QWSIvz7PwfIK-3l2d3CJUjg8Q2Q4RQjHASnlJ88slxqawUzoGI65Oy3TL5HFtmq-kjlvloabwNsM0mVv4V4efYwElT4I3BmJ5vFqiKc5YFOh8-rmXPzlbEAnQopYru9WzxYj8OIJdpdBbmb7-LJyvyl46qcEPB0R1j7inN41h2QPBlwkLCGgq5XFQ-74d9QngBOgMkeUONc5skbXev7RvlTfON3KnwJ9jAUNZ1moLUYLn1JbQMLR7vMaZ45nRMRPyUItV0l1dEazdBC8iNeAto9b9KSdCdicGc2tKUIBBUhV7fQdjvXqolrvEW4i1qo0p5wVB7a0AJgEkTiBIauu4BlqFD8-Q&state=%7B%22teamId%22%3A%22TRVUTD7DM%22%2C%22channelId%22%3A%22CRTKGH71S%22%2C%22triggerId%22%3A%22934362141462.879979449463.8e96b69faba09a350c363e97c5789bc3%22%7D');
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('Authentication Successful. Please close this window');
    expect(fetchTokens).toBeCalled();
    expect(storeTokens).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(storeProfile).toBeCalled();
    expect(loadState).toBeCalled();
    expect(updateView).toBeCalled();
  });
});

describe('Spotbot auth - callback from Spotify oauth - bad state', () => {
  loadState.mockReturnValueOnce(Promise.resolve(fullState));
  test('should return invalid state', async () => {
    const response = await request(server)
        .get('/settings/auth/callback?code=AQDGzePSlosx4mzps4-6EnGmBgo48Uc37y8c63sBj3QTKZntcZ7lcmkB93B_c1ihQxBzfxMP2vLOY4iPvy2V-ROmhJdmElTdfz89sbVcztL55JYIUtwQP0-cU0MIQl6_eBtpvuufTyTTMimoBUNc2rFAH8qf_E7VwXhYZNf-bA117QWSIvz7PwfIK-3l2d3CJUjg8Q2Q4RQjHASnlJ88slxqawUzoGI65Oy3TL5HFtmq-kjlvloabwNsM0mVv4V4efYwElT4I3BmJ5vFqiKc5YFOh8-rmXPzlbEAnQopYru9WzxYj8OIJdpdBbmb7-LJyvyl46qcEPB0R1j7inN41h2QPBlwkLCGgq5XFQ-74d9QngBOgMkeUONc5skbXev7RvlTfON3KnwJ9jAUNZ1moLUYLn1JbQMLR7vMaZ45nRMRPyUItV0l1dEazdBC8iNeAto9b9KSdCdicGc2tKUIBBUhV7fQdjvXqolrvEW4i1qo0p5wVB7a0AJgEkTiBIauu4BlqFD8-Q&state=%7B%22teamId%22%3A%22TRVUTD7DM%22%2C%22channelId%22%3A%22CRTKGH71S%22%2C%22triggerId%22%3A%22934362141462.879979449463.8e96b69faba350c363e97c5789bc3%22%7D');
    expect(response.status).toEqual(401);
    expect(response.text).toEqual('Invalid State');
  });
});
