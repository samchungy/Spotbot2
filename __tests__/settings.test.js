// require supertest
const server = require('../server/server').mockapp;
const request = require('supertest');
const {loadState, storeProfile, storeState, storeTokens} = require('../server/components/settings/spotifyAuth/spotifyAuthDAL');
const {fetchAuthorizeURL, fetchProfile, fetchTokens} = require('../server/components/spotify-api/auth');
const {loadSettings, loadView, storeView} = require('../server/components/settings/settingsDAL');
const {sendModal, updateModal} = require('../server/components/slack/api');
const {AuthError} = require('../server/errors/auth');
jest.mock('../server/components/settings/spotifyAuth/spotifyAuthDAL');
jest.mock('../server/components/spotify-api/auth');
jest.mock('../server/components/slack/api');
jest.mock('../server/components/settings/settingsDAL');


const settingsCommand = {
  token: '6r2mZJdBz8Gb8wSl49SHMABa',
  team_id: 'TRVUTD7DM',
  team_domain: 'test-ly33146',
  channel_id: 'CRU3H4MEC',
  channel_name: 'general',
  user_id: 'URVUTD7UP',
  user_name: 'samchungy',
  command: '/spotbot',
  text: 'settings',
  response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/879226852644/M9zQugHnZCMtXNXwdbYIynmw',
  trigger_id: '881543472007.879979449463.7384c6cf0d2df375824f431f7434df61',
};
const authProfile = {
  'country': 'AU',
  'display_name': 'Test User',
  'email': 'testuser@test.com',
  'explicit_content': {
    'filter_enabled': false,
    'filter_locked': false,
  },
  'external_urls': {
    'spotify': 'https://open.spotify.com/user/testuser',
  },
  'followers': {
    'href': null,
    'total': 20,
  },
  'href': 'https://api.spotify.com/v1/users/testuser',
  'id': 'testuser',
  'images': [
    {
      'height': null,
      'url': 'https://google.com',
      'width': null,
    },
  ],
  'product': 'premium',
  'type': 'user',
  'uri': 'spotify:user:testuser',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

describe('Slash Command: /spotbot settings - new db', () => {
  storeState.mockReturnValueOnce(Promise.resolve());
  fetchAuthorizeURL.mockReturnValueOnce(Promise.resolve(`https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61`));
  fetchProfile.mockImplementationOnce(() => Promise.reject(new AuthError('Auth Error')));
  loadSettings.mockReturnValueOnce(Promise.resolve({}));
  sendModal.mockReturnValueOnce(Promise.resolve());
  const modal = {'blocks': [{'accessory': {'action_id': 'auth_url', 'text': {'emoji': true, 'text': ':link: Authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'url': 'https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61'}, 'block_id': 'auth_url', 'text': {'text': 'Click to authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'};
  test('should open a modal settings panel in Slack', async () => {
    const response = await request(server)
        .post('/settings')
        .send(settingsCommand);
    expect(response.status).toEqual(200);
    expect(storeState).toBeCalled();
    expect(fetchAuthorizeURL).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(sendModal).toBeCalledWith('881543472007.879979449463.7384c6cf0d2df375824f431f7434df61', modal);
  });
});

describe(`Slack Block Action: Click 'Click to Authenticate' button`, () => {
  storeView.mockReturnValueOnce(Promise.resolve());
  test('should store the view in our db', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: '{"type":"block_actions","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","container":{"type":"view","view_id":"VS8L7QY6S"},"trigger_id":"890024202356.879979449463.6da28f984b466202a27acb43ba13bcce","view":{"id":"VS8L7QY6S","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"auth_url","text":{"type":"mrkdwn","text":"Click to authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"auth_url","text":{"type":"plain_text","text":":link: Authenticate with Spotify","emoji":true},"url":"https:\\/\\/accounts.spotify.com\\/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http:\\/\\/localhost:3000\\/settings\\/auth\\/callback&scope=user-read-private%20user-read-email%20user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=890023562052.879979449463.16085a5fc8fe42bb04003ab6c4379db1&show_dialog=true"}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{}},"hash":"1577859805.35cbb4f4","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VS8L7QY6S","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"},"actions":[{"action_id":"auth_url","block_id":"auth_url","text":{"type":"plain_text","text":":link: Authenticate with Spotify","emoji":true},"type":"button","action_ts":"1577859981.433572"}]}'});
    expect(response.status).toEqual(200);
    expect(storeView).toBeCalledWith({'triggerId': '890024202356.879979449463.6da28f984b466202a27acb43ba13bcce', 'viewId': 'VS8L7QY6S'});
  });
});

describe(`Spotify Auth Callback - Update Modal`, () => {
  storeState.mockReturnValueOnce(Promise.resolve());
  storeView.mockReturnValueOnce(Promise.resolve());
  loadState.mockReturnValueOnce(Promise.resolve(`890023562052.879979449463.16085a5fc8fe42bb04003ab6c4379db1`));
  fetchTokens.mockReturnValueOnce(Promise.resolve({access_token: 'test', refresh_token: 'test2'}));
  storeTokens.mockReturnValueOnce(Promise.resolve());
  fetchProfile.mockImplementationOnce(() => Promise.resolve(authProfile)).mockImplementationOnce(() => Promise.resolve(authProfile));
  storeProfile.mockReturnValueOnce(Promise.resolve());
  fetchAuthorizeURL.mockReturnValueOnce(Promise.resolve(`https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61`));
  updateModal.mockReturnValueOnce(Promise.resolve());
  loadView.mockReturnValueOnce(Promise.resolve({viewId: 'testViewId', trigger_id: 'testTriggerId'}));
  test('should update Slack Modal with authenticated settings panel', async () => {
    const response = await request(server)
        .get('/settings/auth/callback')
        .query({code: `AQBoCKqo7KOE242s8yNZS-URTwoDl_zA-JDRf3zZkAEjqjQTI_c5SDo_ZRYW1JqUsZo5vSbeJ31Lo-VbAki4loHTIbUs5lvH0VLSkbKwKn16vHoCMWhRRG7K-Xeta1zV__I84LSbT4Kjg4TuL9bjHclFy9vvnbXsOqes5zH2HoyjXfAmMtxom34DUpUx_MvMwzarSyeo4vs2ZqUb8EvoQI3uj0v1F8O8H_s2xHra9eIwGpLewunevrlDb25I0p_ieRViSpQ5ZfF-z-0K261sV-8E27YCCxma24F17bJ5CySqr-3cgfSDdGg7S4SSSm_o31Frpf-aoAh47XfVNOLAwCI4zq0w2wqQf7zZcHNcyh3MjfRaaT3q_HkCVBm-DO78Cz9WMfs0XJ8ok11-dK4JwZK04QkPPkkV4j0Li9driiDSJt49IJhrnjvUs05rRCTtMzAGavq0X42D54YPR-Rv6qn0Wi-MCpqTCXioQWOhgCWEz5t2Mf2I0tNfqvrXEORIKZ-tAH3xjg`, state: `890023562052.879979449463.16085a5fc8fe42bb04003ab6c4379db1`});
    expect(response.status).toEqual(200);
    expect(loadState).toBeCalled();
    expect(loadView).toBeCalled();
    expect(storeTokens).toBeCalled();
    expect(storeProfile).toBeCalled();
    expect(storeState).toBeCalled();
    expect(storeTokens).toBeCalled();
    expect(fetchAuthorizeURL).toBeCalled();
    expect(fetchTokens).toBeCalled();
    expect(fetchProfile).toHaveBeenCalledTimes(2);
    expect(updateModal).toBeCalledWith('testViewId', {'blocks': [{'accessory': {'action_id': 'reauth', 'text': {'emoji': true, 'text': ':gear: Re-authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'value': 'reauth'}, 'block_id': 'reauth', 'text': {'text': 'Click to re-authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'auth_confirmation', 'elements': [{'text': ':white_check_mark: Authenticated with Test User - Spotify Premium', 'type': 'mrkdwn'}], 'type': 'context'}, {'block_id': 'slack_channel', 'element': {'action_id': 'slack_channel', 'type': 'channels_select'}, 'hint': {'text': 'The channel Slackbot will restrict usage of commands to.', 'type': 'plain_text'}, 'label': {'text': 'Slack Channel Restriction', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'playlist', 'element': {'action_id': 'playlist', 'min_query_length': 3, 'type': 'external_select'}, 'hint': {'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.', 'type': 'plain_text'}, 'label': {'text': 'Spotbot Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'default_device', 'element': {'action_id': 'default_device', 'min_query_length': 0, 'type': 'external_select'}, 'hint': {'text': 'This helps Spotbot with playing. Turn on your Spotify device now.', 'type': 'plain_text'}, 'label': {'text': 'Default Spotify Device', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'disable_repeats_duration', 'element': {'action_id': 'disable_repeats_duration', 'max_length': 5, 'placeholder': {'text': 'Enter a number eg. 4', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.', 'type': 'plain_text'}, 'label': {'text': 'Disable Repeats Duration (Hours)', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'back_to_playlist', 'element': {'action_id': 'back_to_playlist', 'options': [{'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, {'text': {'emoji': true, 'text': 'No', 'type': 'plain_text'}, 'value': 'false'}], 'type': 'static_select'}, 'hint': {'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).', 'type': 'plain_text'}, 'label': {'text': 'Jump Back to Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes', 'element': {'action_id': 'skip_votes', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 2', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes_ah', 'element': {'action_id': 'skip_votes_ah', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 0', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes - After Hours (6pm-6am)', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe('Slash Command: /spotbot settings - Authenticated', () => {
  storeState.mockReturnValueOnce(Promise.resolve());
  fetchAuthorizeURL.mockReturnValueOnce(Promise.resolve(`https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61`));
  fetchProfile.mockImplementationOnce(() => Promise.resolve(authProfile));
  loadSettings.mockReturnValueOnce(Promise.resolve({}));
  sendModal.mockReturnValueOnce(Promise.resolve());
  const modal = {'blocks': [{'accessory': {'action_id': 'reauth', 'text': {'emoji': true, 'text': ':gear: Re-authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'value': 'reauth'}, 'block_id': 'reauth', 'text': {'text': 'Click to re-authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'auth_confirmation', 'elements': [{'text': ':white_check_mark: Authenticated with Test User - Spotify Premium', 'type': 'mrkdwn'}], 'type': 'context'}, {'block_id': 'slack_channel', 'element': {'action_id': 'slack_channel', 'type': 'channels_select'}, 'hint': {'text': 'The channel Slackbot will restrict usage of commands to.', 'type': 'plain_text'}, 'label': {'text': 'Slack Channel Restriction', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'playlist', 'element': {'action_id': 'playlist', 'min_query_length': 3, 'type': 'external_select'}, 'hint': {'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.', 'type': 'plain_text'}, 'label': {'text': 'Spotbot Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'default_device', 'element': {'action_id': 'default_device', 'min_query_length': 0, 'type': 'external_select'}, 'hint': {'text': 'This helps Spotbot with playing. Turn on your Spotify device now.', 'type': 'plain_text'}, 'label': {'text': 'Default Spotify Device', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'disable_repeats_duration', 'element': {'action_id': 'disable_repeats_duration', 'max_length': 5, 'placeholder': {'text': 'Enter a number eg. 4', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.', 'type': 'plain_text'}, 'label': {'text': 'Disable Repeats Duration (Hours)', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'back_to_playlist', 'element': {'action_id': 'back_to_playlist', 'options': [{'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, {'text': {'emoji': true, 'text': 'No', 'type': 'plain_text'}, 'value': 'false'}], 'type': 'static_select'}, 'hint': {'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).', 'type': 'plain_text'}, 'label': {'text': 'Jump Back to Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes', 'element': {'action_id': 'skip_votes', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 2', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes_ah', 'element': {'action_id': 'skip_votes_ah', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 0', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes - After Hours (6pm-6am)', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'};
  test('should open an authenticated Slack Modal', async () => {
    const response = await request(server)
        .post('/settings')
        .send(settingsCommand);
    expect(response.status).toEqual(200);
    expect(storeState).toBeCalled();
    expect(fetchAuthorizeURL).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(sendModal).toBeCalledWith('881543472007.879979449463.7384c6cf0d2df375824f431f7434df61', modal);
  });
});
