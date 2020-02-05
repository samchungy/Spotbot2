const port = 4011;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadPlaylist, loadProfile} = require('../../server/components/settings/settings-interface');
const {loadSearch, storeSearch} = require('../../server/components/tracks/tracks-dal');
const {fetchSearchTracks} = require('../../server/components/spotify-api/spotify-api-search');
const {postEphemeral, reply} = require('../../server/components/slack/slack-api');
const {TRACK_RESPONSE} = require('../../server/components/tracks/tracks-find');

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-search');
jest.mock('../../server/components/spotify-api/spotify-api-devices');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/control/control-panel');
jest.mock('../../server/util/util-timeout');
jest.mock('../../server/components/tracks/tracks-dal');

const {findSlashPayload} = require('../mocks/payloads/slash-commands');
const {mockSearchTracks} = require('../mocks/spotify-api/search');
const {cancelPayload, seeMorePayload} = require('../mocks/payloads/slack-actions');
const {fullTrackSearch} = require('../mocks/db/search');
const {fullPlaylistSetting, fullProfile} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slash Command: /play - empty text', () => {
  const findSlashEmptyPayload = {...findSlashPayload};
  findSlashEmptyPayload.text = '';

  test('should return empty query', async () => {
    const response = await request(server)
        .post('/tracks/find/')
        .send(findSlashEmptyPayload);
    expect(response.status).toEqual(200);
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': findSlashEmptyPayload.channel_id, 'text': TRACK_RESPONSE.query_empty, 'user': findSlashEmptyPayload.user_id});
  });
});

describe('Slash Command: /play - invalid query', () => {
  const findSlashInvalidPayload = {...findSlashPayload};
  findSlashInvalidPayload.text = '***';

  test('should return invalid query', async () => {
    const response = await request(server)
        .post('/tracks/find/')
        .send(findSlashInvalidPayload);
    expect(response.status).toEqual(200);
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': findSlashInvalidPayload.channel_id, 'text': TRACK_RESPONSE.query_error, 'user': findSlashInvalidPayload.user_id});
  });
});

describe('Slash Command: /play - query lime', () => {
  const findSlashLimePayload = {...findSlashPayload};
  findSlashLimePayload.text = 'lime';
  loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
  fetchSearchTracks.mockReturnValueOnce(Promise.resolve(mockSearchTracks));
  loadSearch.mockReturnValueOnce(Promise.resolve(fullTrackSearch));

  test('should return a track payload', async () => {
    const response = await request(server)
        .post('/tracks/find/')
        .send(findSlashLimePayload);
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(fetchSearchTracks).toBeCalled();
    expect(storeSearch).toBeCalledTimes(2);
    expect(loadSearch).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': expect.anything(), 'channel': findSlashLimePayload.channel_id, 'text': TRACK_RESPONSE.found, 'user': findSlashLimePayload.user_id});
  });
});

describe('Get 3 more tracks', () => {
  loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
  loadSearch.mockReturnValueOnce(Promise.resolve(fullTrackSearch));

  test('should return a track payload', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: seeMorePayload});
    expect(response.status).toEqual(200);
    expect(storeSearch).toBeCalled();
    expect(loadSearch).toBeCalled();
    expect(reply).toBeCalledWith({'blocks': expect.anything(), 'replace_original': 'true', 'text': TRACK_RESPONSE.found}, expect.anything());
  });
});

describe('Get 3 more tracks old', () => {
  loadSearch.mockReturnValueOnce(Promise.resolve(null));

  test('should return expired', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: seeMorePayload});
    expect(response.status).toEqual(200);
    expect(loadSearch).toBeCalled();
    expect(reply).toBeCalledWith({'replace_original': 'true', 'text': TRACK_RESPONSE.expired}, expect.anything());
  });
});

describe('Cancel search', () => {
  test('should return search cancelled', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: cancelPayload});
    expect(response.status).toEqual(200);
    expect(reply).toBeCalledWith({'replace_original': 'true', 'text': `:information_source: Search cancelled.`}, expect.anything());
  });
});


