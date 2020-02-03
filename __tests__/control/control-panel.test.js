const {loadBackToPlaylist, loadPlaylist} = require('../../server/components/settings/settings-interface');
const {fetchCurrentPlayback} = require('../../server/components/spotify-api/spotify-api-playback-status');
const {updatePanel, PANEL_RESPONSE} = require('../../server/components/control/control-panel');
const {post} = require('../../server/components/slack/slack-api');

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-playback');
jest.mock('../../server/components/spotify-api/spotify-api-playlists');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/util/util-timeout');
jest.mock('../../server/components/slack/slack-api');


const {fullPlaylistSetting} = require('../mocks/db/settings');
const TEAM = 'testteam';
const CHANNEL = 'testchannel';

beforeEach(() => {
  jest.clearAllMocks();
});


loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Test Control Update Panel', () => {
  fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve({}));
  loadBackToPlaylist.mockReturnValueOnce(Promise.resolve('true'));

  test('should return not playing', async () => {
    fetchCurrentPlayback.mockReturnValueOnce(Promise.resolve({}));
    await updatePanel(TEAM, CHANNEL);
    expect(fetchCurrentPlayback).toBeCalled();
    expect(loadBackToPlaylist).toBeCalled();
    expect(post).toBeCalledWith({blocks: expect.anything(), channel: CHANNEL, text: PANEL_RESPONSE.not_playing});
  });
});

