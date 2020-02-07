const port = 4008;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadPlaylist} = require('../../server/components/settings/settings-interface');
const {deleteTracks, fetchTracks, fetchPlaylistTotal, replaceTracks} = require('../../server/components/spotify-api/spotify-api-playlists');
const {updatePanel} = require('../../server/components/control/control-panel');
const {RESET_RESPONSE} = require('../../server/components/control/control-reset');
const {post, sendModal} = require('../../server/components/slack/slack-api');
const {setJumpToStart} = require('../../server/components/control/control-jump');

Date.now = jest.fn(() => 1580638265724);

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/spotify-api/spotify-api-playlists');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/control/control-panel');
jest.mock('../../server/util/util-timeout');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/control/control-jump');
jest.mock('../../server/components/slack/slack-middleware', () => jest.fn(async (ctx, next) => await next()));

const {resetPayload, resetReviewPayload, resetReviewClosePayload} = require('../mocks/payloads/slack-actions');
const {mockFetchCurrentPlayback} = require('../mocks/spotify-api/playback-status');
const {mockFetchTracks, mockFetchTracksOld} = require('../mocks/spotify-api/playlist');
const {fullPlaylistSetting} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slack Action - Click Reset button', () => {
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 8}}));
  fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracks));

  test('should return 8 tracks to review', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: resetPayload});
    expect(response.status).toEqual(200);
    expect(fetchPlaylistTotal).toBeCalled();
    expect(fetchTracks).toBeCalled();
    expect(sendModal).toBeCalledWith('922632594273.879979449463.51b0ea438ac2896f9ce5db6a01a889ea', {'blocks': [{'text': {'text': 'Hold up! *8* tracks were added in the past 30 minutes. Are you sure you want to remove them?', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'reset_review', 'element': {'action_id': 'reset_review', 'option_groups': [{'label': {'text': 'Added less than 30 minutes ago', 'type': 'plain_text'}, 'options': [{'text': {'emoji': true, 'text': 'Gang of Youths - Let Me Down Easy (Explicit)', 'type': 'plain_text'}, 'value': 'spotify:track:7DPQwyMQADl9Y8oSvSVpfg'}, {'text': {'emoji': true, 'text': 'San Cisco - When I Dream', 'type': 'plain_text'}, 'value': 'spotify:track:579j0QRchEajNo11kaaAUx'}, {'text': {'emoji': true, 'text': 'Sticky Fingers - Rum Rage', 'type': 'plain_text'}, 'value': 'spotify:track:5uBK8Ap1BCEc4GgMcEjeic'}, {'text': {'emoji': true, 'text': 'Ocean Alley - Confidence', 'type': 'plain_text'}, 'value': 'spotify:track:7to68V64Cu6zk0UDo5tyw3'}, {'text': {'emoji': true, 'text': 'Hockey Dad - Seaweed', 'type': 'plain_text'}, 'value': 'spotify:track:4vU4WsqWJlxCfRiKaumIyj'}, {'text': {'emoji': true, 'text': 'The Jungle Giants - Used to Be in Love', 'type': 'plain_text'}, 'value': 'spotify:track:290xSzR8Ee9fm82poMg4od'}, {'text': {'emoji': true, 'text': 'Skegss - Spring Has Sprung (Explicit)', 'type': 'plain_text'}, 'value': 'spotify:track:6QTnepzvMUNiJT5kS2OZmg'}, {'text': {'emoji': true, 'text': 'Lime Cordiale - Temper Temper', 'type': 'plain_text'}, 'value': 'spotify:track:3DCU0R5FFaB9GKxZERb5wr'}]}], 'type': 'multi_static_select'}, 'hint': {'text': 'Tracks added in the past 10 minutes have been pre-selected. Closing this window will keep none.', 'type': 'plain_text'}, 'label': {'text': 'Select songs to keep on the playlist', 'type': 'plain_text'}, 'optional': true, 'type': 'input'}, {'block_id': 'reset_review_jump', 'element': {'action_id': 'reset_review_jump', 'initial_option': {'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, 'options': [{'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, {'text': {'emoji': true, 'text': 'No', 'type': 'plain_text'}, 'value': 'false'}], 'type': 'static_select'}, 'hint': {'text': 'This will only work if a track is selected above.', 'type': 'plain_text'}, 'label': {'text': 'Jump to the start of the playlist?', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'reset_review', 'close': {'emoji': true, 'text': 'Close', 'type': 'plain_text'}, 'notify_on_close': true, 'private_metadata': '{"teamId":"TRVUTD7DM","playlistId":"2nuwjAGCHQiPabqGH6SLty","channelId":"CRVUTDP47","timestamp":"1580625619.001200","offset":-92}', 'submit': {'emoji': true, 'text': 'Confirm', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Reset: Review Tracks', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe('Slack Action - Click Reset button', () => {
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 8}}));
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 8}}));
  fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracksOld));

  test('should return not playing', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: resetPayload});
    expect(response.status).toEqual(200);
    expect(fetchPlaylistTotal).toBeCalledTimes(2);
    expect(fetchTracks).toBeCalled();
    expect(replaceTracks).toBeCalled();
    expect(deleteTracks).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': RESET_RESPONSE.success('URVUTD7UP')});
  });
});


describe('Slack Action - Submit Review', () => {
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 8}}));
  fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracks));
  setJumpToStart.mockReturnValueOnce(Promise.resolve({success: true, status: mockFetchCurrentPlayback}));

  test('should return not playing', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: resetReviewPayload});
    expect(response.status).toEqual(200);
    expect(fetchTracks).toBeCalled();
    expect(deleteTracks).toBeCalled();
    expect(fetchPlaylistTotal).toBeCalled();
    expect(setJumpToStart).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': RESET_RESPONSE.success('URVUTD7UP') +' 8 tracks from the past 30 minutes were kept. Spotbot is now playing from the start of the playlist.'});
  });
});

describe('Slack Action - Close Review', () => {
  fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracks));
  setJumpToStart.mockReturnValueOnce(Promise.resolve({success: true, status: mockFetchCurrentPlayback}));
  fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 8}}));

  test('should return not playing', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: resetReviewClosePayload});
    expect(response.status).toEqual(200);
    expect(replaceTracks).toBeCalled();
    expect(deleteTracks).toBeCalled();
    expect(updatePanel).toBeCalled();
    expect(fetchPlaylistTotal).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': RESET_RESPONSE.success('URVUTD7UP')});
  });
});
