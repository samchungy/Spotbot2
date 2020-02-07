const port = 4003;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadDevices, loadPlaylists, loadSettings, storeSettings} = require('../../server/components/settings/settings-dal');
const {loadProfile} = require('../../server/components/settings/settings-interface');
const {createPlaylist} = require('../../server/components/spotify-api/spotify-api-playlists');
const {postEphemeral} = require('../../server/components/slack/slack-api');

jest.mock('../../server/components/settings/settings-dal');
jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playlists');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/slack/slack-middleware', () => jest.fn(async (ctx, next) => await next()));

const {emptySettings, fullDevice, fullPlaylists, fullProfile} = require('../mocks/db/settings');
const {settingsCreatePlaylistPayload, settingsRegularPayload} = require('../mocks/payloads/slack-actions');
const {mockCreatePlaylist} = require('../mocks/spotify-api/playlist');


beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadDevices.mockReturnValue(Promise.resolve(fullDevice));
loadPlaylists.mockReturnValue(Promise.resolve(fullPlaylists));
loadProfile.mockReturnValue(Promise.resolve(fullProfile));
loadSettings.mockReturnValue(Promise.resolve(emptySettings));
createPlaylist.mockReturnValue(Promise.resolve(mockCreatePlaylist));


describe('Spotbot settings - submit settings create playlist', () => {
  test('should create a new playlist, save settings', async () => {
    const response = await request(server)
        .post('/slack/actions/')
        .send({payload: settingsCreatePlaylistPayload});
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(loadDevices).toBeCalled();
    expect(createPlaylist).toBeCalled();
    expect(storeSettings).toBeCalled();
    expect(postEphemeral).toBeCalled();
  });
});


describe('Spotbot settings - submit settings regular payload - none device option', () => {
  test('should save settings', async () => {
    const response = await request(server)
        .post('/slack/actions/')
        .send({payload: settingsRegularPayload});
    expect(response.status).toEqual(200);
    expect(loadPlaylists).toBeCalled();
    expect(storeSettings).toBeCalled();
    expect(postEphemeral).toBeCalled();
  });
});

