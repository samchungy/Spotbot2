const port = 4015;
const server = require('../../server/server')({port});
const request = require('supertest');

const {deleteTracks, fetchPlaylistTotal, fetchTracks} = require('../../server/components/spotify-api/spotify-api-playlists');
const {fetchTracksInfo} = require('../../server/components/spotify-api/spotify-api-tracks');
const {loadPlaylist, loadProfile} = require('../../server/components/settings/settings-interface');
const {batchLoadSearch} = require('../../server/components/tracks/tracks-dal');
const {post, sendModal} = require('../../server/components/slack/slack-api');

Date.now = jest.fn(() => 1580733627881);

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playlists');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/tracks/tracks-dal');
jest.mock('../../server/components/spotify-api/spotify-api-tracks');
jest.mock('../../server/components/slack/slack-middleware', () => jest.fn(async (ctx, next) => await next()));

const {mockFetchTracksRemove} = require('../mocks/spotify-api/playlist');
const {mockFetchTracksInfo} = require('../mocks/spotify-api/tracks');
const {removeTracksPayload} = require('../mocks/payloads/slack-actions');
const {removeTrackSlashPayload} = require('../mocks/payloads/slash-commands');
const {fullBatchLoad} = require('../mocks/db/search');
const {fullPlaylistSetting, fullProfile} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slash command /removetrack', () => {
  test('should open a slack modal for tracks', async () => {
    loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
    fetchPlaylistTotal.mockReturnValueOnce(Promise.resolve({tracks: {total: 9}}));
    fetchTracks.mockReturnValueOnce(Promise.resolve(mockFetchTracksRemove));
    batchLoadSearch.mockReturnValueOnce(Promise.resolve(fullBatchLoad));
    const response = await request(server)
        .post('/tracks/remove')
        .send(removeTrackSlashPayload);
    expect(response.status).toEqual(200);
    expect(loadPlaylist).toBeCalled();
    expect(loadProfile).toBeCalled();
    expect(fetchPlaylistTotal).toBeCalled();
    expect(fetchTracks).toBeCalled();
    expect(batchLoadSearch).toBeCalled();
    expect(sendModal).toBeCalledWith('920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3', {'blocks': [{'block_id': 'remove_modal', 'element': {'action_id': 'remove_modal', 'options': [{'text': {'emoji': true, 'text': 'Crooked Colours - Do It Like You', 'type': 'plain_text'}, 'value': 'spotify:track:1sCgWGukswGPlym4ggdoav'}, {'text': {'emoji': true, 'text': 'Golden Features, The Presets - Paradise', 'type': 'plain_text'}, 'value': 'spotify:track:2xbh5NWAm6zjfeZg3yrwbO'}, {'text': {'emoji': true, 'text': 'Golden Features, The Presets - Raka', 'type': 'plain_text'}, 'value': 'spotify:track:2hGEh8arAfHzomA28XHPdD'}], 'type': 'multi_static_select'}, 'hint': {'text': 'Selected tracks will be removed when you click Confirm', 'type': 'plain_text'}, 'label': {'text': 'Select Tracks to Remove', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'remove_modal', 'close': {'emoji': true, 'text': 'Close', 'type': 'plain_text'}, 'notify_on_close': true, 'private_metadata': 'CRVUTDP47', 'submit': {'emoji': true, 'text': 'Confirm', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Remove Tracks', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe('Slash command /removetrack', () => {
  test('should open a slack modal for tracks', async () => {
    loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
    loadPlaylist.mockReturnValueOnce(Promise.resolve(fullPlaylistSetting));
    fetchTracksInfo.mockReturnValueOnce(Promise.resolve(mockFetchTracksInfo));
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: removeTracksPayload});
    expect(response.status).toEqual(200);
    expect(loadPlaylist).toBeCalled();
    expect(loadProfile).toBeCalled();
    expect(fetchTracksInfo).toBeCalled();
    expect(deleteTracks).toBeCalled();
    expect(post).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': ':put_litter_in_its_place: San Cisco - Skin was removed from the playlist by <@URVUTD7UP>.'});
  });
});
