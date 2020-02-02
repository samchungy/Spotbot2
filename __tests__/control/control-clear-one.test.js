const port = 4009;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadPlaylist} = require('../../server/components/settings/settings-interface');
const {deleteTracks, fetchTracks, fetchPlaylistTotal} = require('../../server/components/spotify-api/spotify-api-playlists');
const {updatePanel} = require('../../server/components/control/control-panel');
const {CLEAR_RESPONSE} = require('../../server/components/control/control-clear-one');
const {post} = require('../../server/components/slack/slack-api');

Date.now = jest.fn(() => 1580638265724);

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/spotify-api/spotify-api-playlists');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/control/control-panel');
jest.mock('../../server/util/util-timeout');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/control/control-jump');

const {clearOneDayPayload} = require('../mocks/payloads/slack-actions');
const {mockFetchTracks, mockFetchTracksDayOld} = require('../mocks/spotify-api/playlist');
const {fullPlaylistSetting} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slack Action - Click Clear One Day button', () => {
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 8}}));
  fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracks));

  test('should clear no songs', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: clearOneDayPayload});
    expect(response.status).toEqual(200);
    expect(fetchPlaylistTotal).toBeCalled();
    expect(fetchTracks).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': CLEAR_RESPONSE.success('URVUTD7UP')});
  });
});

describe('Slack Action - Click Clear One Day button', () => {
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 8}}));
  fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracksDayOld));

  test('should clear no songs', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: clearOneDayPayload});
    expect(response.status).toEqual(200);
    expect(fetchPlaylistTotal).toBeCalled();
    expect(fetchTracks).toBeCalled();
    expect(deleteTracks).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': CLEAR_RESPONSE.success('URVUTD7UP')});
  });
});

