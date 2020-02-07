const port = 4017;
const server = require('../../server/server')({port});
const request = require('supertest');

const {fetchTracksInfo} = require('../../server/components/spotify-api/spotify-api-tracks');
const {fetchRecent} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {loadAdmins, loadPlaylist, loadProfile} = require('../../server/components/settings/settings-interface');
const {loadSkip} = require('../../server/components/control/control-dal');
const {postEphemeral, sendModal} = require('../../server/components/slack/slack-api');
const {loadBlacklist, storeBlacklist} = require('../../server/components/settings/blacklist/blacklist-dal');

Date.now = jest.fn(() => 1580733627881);

jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/spotify-api/spotify-api-tracks');
jest.mock('../../server/components/settings/blacklist/blacklist-dal');
jest.mock('../../server/components/control/control-dal');
jest.mock('../../server/components/slack/slack-middleware', () => jest.fn(async (ctx, next) => await next()));

const {mockFetchTracksInfo} = require('../mocks/spotify-api/tracks');
const {mockFetchRecent} = require('../mocks/spotify-api/playback-status');
const {blacklistPayload} = require('../mocks/payloads/slack-actions');
const {blacklistSlashPayload} = require('../mocks/payloads/slash-commands');
const {fullSkip} = require('../mocks/db/control');
const {fullPlaylistSetting, fullProfile} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));
loadAdmins.mockReturnValue(Promise.resolve(['URVUTD7UP']));

describe('Slash command /spotbot blacklist', () => {
  test('should open a slack modal for blacklist', async () => {
    loadBlacklist.mockReturnValueOnce(Promise.resolve([]));
    fetchRecent.mockReturnValueOnce(Promise.resolve(mockFetchRecent));
    loadSkip.mockReturnValueOnce(Promise.resolve(fullSkip));
    const response = await request(server)
        .post('/settings')
        .send(blacklistSlashPayload);
    expect(response.status).toEqual(200);
    expect(loadPlaylist).toBeCalled();
    expect(loadBlacklist).toBeCalled();
    expect(fetchRecent).toBeCalled();
    expect(loadSkip).toBeCalled();
    expect(sendModal).toBeCalledWith('920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3', {'blocks': [{'block_id': 'blacklist_modal', 'element': {'action_id': 'blacklist_modal', 'option_groups': [{'label': {'text': 'Recently played:', 'type': 'plain_text'}, 'options': [{'text': {'emoji': true, 'text': 'Eves Karydas - Further Than The Planes Fly', 'type': 'plain_text'}, 'value': '7zLRffQwJIA3o5UIHKIU48'}, {'text': {'emoji': true, 'text': 'Thelma Plum - Better in Blak (Explicit)', 'type': 'plain_text'}, 'value': '1c5iUY7Zg1SxtROg1yr5ad'}, {'text': {'emoji': true, 'text': 'The Jungle Giants - Heavy Hearted', 'type': 'plain_text'}, 'value': '3yXgttblOo006gd4eGOvw1'}, {'text': {'emoji': true, 'text': 'The Jungle Giants - Heavy Hearted', 'type': 'plain_text'}, 'value': '3yXgttblOo006gd4eGOvw1'}, {'text': {'emoji': true, 'text': 'G Flip - Killing My Time (Explicit)', 'type': 'plain_text'}, 'value': '1DqSH6zUIBiIb1aQWyFr08'}]}], 'type': 'multi_static_select'}, 'hint': {'text': 'Songs which are blacklisted cannot be added through Spotbot. They can also be skipped instantly. Max tracks: 80', 'type': 'plain_text'}, 'label': {'text': 'Blacklisted Tracks', 'type': 'plain_text'}, 'optional': true, 'type': 'input'}], 'callback_id': 'blacklist_modal', 'close': {'emoji': true, 'text': 'Close', 'type': 'plain_text'}, 'private_metadata': 'CRVUTDP47', 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Blacklist', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe('submit blacklist', () => {
  test('should submit a blacklist', async () => {
    loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
    loadBlacklist.mockReturnValueOnce(Promise.resolve([]));
    fetchTracksInfo.mockReturnValueOnce(Promise.resolve(mockFetchTracksInfo));
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: blacklistPayload});
    expect(response.status).toEqual(200);
    expect(loadPlaylist).toBeCalled();
    expect(loadBlacklist).toBeCalled();
    expect(loadProfile).toBeCalled();
    expect(fetchTracksInfo).toBeCalled();
    expect(storeBlacklist).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': ':white_check_mark: Blacklisted successfully updated.', 'user': 'URVUTD7UP'});
  });
});
