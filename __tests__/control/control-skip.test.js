const port = 4004;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadPlaylist, loadProfile, loadSkipVotesAfterHours, loadTimezone} = require('../../server/components/settings/settings-interface');
const {loadBlacklist} = require('../../server/components/settings/blacklist/blacklist-dal');
const {fetchCurrentPlayback} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {updatePanel} = require('../../server/components/control/control-panel');
const {loadSkip, storeSkip} = require('../../server/components/control/control-dal');
const {skip} = require('../../server/components/spotify-api/spotify-api-playback');
const {deleteChat, post, postEphemeral, reply, updateChat} = require('../../server/components/slack/slack-api');
const {SKIP_RESPONSE} = require('../../server/components/control/contol-skip');

jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/settings/blacklist/blacklist-dal');
jest.mock('../../server/components/control/control-panel');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/control/control-dal');
jest.mock('../../server/components/slack/slack-middleware', () => jest.fn(async (ctx, next) => await next()));

const {skipSlashPayload} = require('../mocks/payloads/slash-commands');
const {voteSkipPayload} = require('../mocks/payloads/slack-actions');
const {fullPlaylistSetting, fullProfile} = require('../mocks/db/settings');
const {fullBlacklist} = require('../mocks/db/blacklist');
const {fullSkip, fullSkipNoUser, fullSkipOneVoteNeeded, fullSkipExpired} = require('../mocks/db/control');
const {mockFetchCurrentPlayback} = require('../mocks/spotify-api/playback-status');
const {mockPost} = require('../mocks/payloads/slack-api');

Date.now = jest.fn(() => 1580560064337);

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadProfile.mockReturnValue(Promise.resolve(fullProfile));
loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));
post.mockReturnValue(mockPost);


describe('Slash Command: /skip', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve({}));

  test('should open a currently not playing panel', async () => {
    const response = await request(server)
        .post('/control/skip/')
        .send(skipSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(updatePanel).toBeCalledWith(skipSlashPayload.team_id, skipSlashPayload.channel_id, null, SKIP_RESPONSE.not_playing, {});
  });
});

describe('Slash Command: /skip', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  loadBlacklist.mockReturnValueOnce(Promise.resolve(fullBlacklist));

  test('should skip a song on the blacklist', async () => {
    const response = await request(server)
        .post('/control/skip/')
        .send(skipSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(loadBlacklist).toBeCalled();
    expect(skip).toBeCalled();
    expect(post).toBeCalled();
  });
});

describe('Slash Command: /skip', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  loadBlacklist.mockReturnValueOnce(Promise.resolve([]));
  loadSkip.mockReturnValueOnce(Promise.resolve(fullSkip));

  test('should return "you have already voted"', async () => {
    const response = await request(server)
        .post('/control/skip/')
        .send(skipSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(loadBlacklist).toBeCalled();
    expect(loadSkip).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': skipSlashPayload.channel_id, 'text': SKIP_RESPONSE.already, 'user': 'URVUTD7UP'});
  });
});

describe('Slash Command: /skip', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  loadBlacklist.mockReturnValueOnce(Promise.resolve([]));
  loadSkip.mockReturnValueOnce(Promise.resolve(fullSkipNoUser));

  test('should add a vote to the post', async () => {
    const response = await request(server)
        .post('/control/skip/')
        .send(skipSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(loadBlacklist).toBeCalled();
    expect(loadSkip).toBeCalled();
    expect(updateChat).toBeCalled();
    expect(storeSkip).toBeCalled();
  });
});

describe('Slash Command: /skip', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  loadBlacklist.mockReturnValueOnce(Promise.resolve([]));
  loadSkip.mockReturnValueOnce(Promise.resolve(null));
  loadTimezone.mockReturnValueOnce(Promise.resolve('Australia/Melbourne'));
  loadSkipVotesAfterHours.mockReturnValueOnce(Promise.resolve('2'));

  test('should start a skip vote', async () => {
    const response = await request(server)
        .post('/control/skip/')
        .send(skipSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(loadBlacklist).toBeCalled();
    expect(loadSkip).toBeCalled();
    expect(loadTimezone).toBeCalled();
    expect(loadSkipVotesAfterHours).toBeCalled();
    expect(storeSkip).toBeCalled();
    expect(post).toBeCalled();
    expect(storeSkip).toBeCalledWith(skipSlashPayload.team_id, skipSlashPayload.channel_id, {'history': [], 'timestamp': '1580560608.006100', 'track': {'album': 'Langata', 'art': 'https://i.scdn.co/image/ab67616d00001e02d23e426be310ff7f761217b7', 'artists': 'Crooked Colours', 'duration': '3:10', 'id': '1sCgWGukswGPlym4ggdoav', 'name': 'Do It Like You', 'title': 'Crooked Colours - Do It Like You', 'uri': 'spotify:track:1sCgWGukswGPlym4ggdoav', 'url': 'https://open.spotify.com/track/1sCgWGukswGPlym4ggdoav'}, 'users': ['URVUTD7UP'], 'votesNeeded': 2});
  });
});

describe('Use control skip button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  loadSkip.mockReturnValueOnce(Promise.resolve(fullSkipOneVoteNeeded));

  test('should add a vote and skip', async () => {
    const response = await request(server)
        .post('/slack/actions/')
        .send({payload: voteSkipPayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(loadSkip).toBeCalled();
    expect(deleteChat).toBeCalled();
    expect(storeSkip).toBeCalled();
    expect(skip).toBeCalled();
    expect(post).toBeCalled();
  });
});

describe('Use control skip button', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve(mockFetchCurrentPlayback));
  loadSkip.mockReturnValueOnce(Promise.resolve(fullSkipExpired));

  test('should expire the vote', async () => {
    const response = await request(server)
        .post('/slack/actions/')
        .send({payload: voteSkipPayload});
    expect(response.status).toEqual(200);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(loadSkip).toBeCalled();
    expect(reply).toBeCalled();
  });
});

