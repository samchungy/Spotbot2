// require supertest
const server = require('../server/server').mockapp;
const request = require('supertest');
const {loadState, storeProfile, storeState, storeTokens} = require('../server/components/settings/spotifyauth/spotifyauth-dal');
const {fetchAuthorizeURL, fetchProfile, fetchTokens} = require('../server/components/spotify-api/spotify-api-auth');
const {loadDevices, loadPlaylists, loadSettings, loadView, storeView, storeDeviceSetting, storePlaylistSetting, storeSettings} = require('../server/components/settings/settings-dal');
const {postEphemeral, sendModal, updateModal} = require('../server/components/slack/slack-api');
const {AuthError} = require('../server/errors/errors-auth');
jest.mock('../server/components/settings/spotifyauth/spotifyauth-dal');
jest.mock('../server/components/spotify-api/spotify-api-auth');
jest.mock('../server/components/slack/slack-api');
jest.mock('../server/components/settings/settings-dal');


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
  sendModal.mockReturnValueOnce(Promise.resolve());
  const modal = {'blocks': [{'accessory': {'action_id': 'auth_url', 'text': {'emoji': true, 'text': ':link: Authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'url': 'https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61'}, 'block_id': 'auth_url', 'text': {'text': 'Click to authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'};
  test('should open a modal settings panel in Slack with auth prompt', async () => {
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

describe(`Spotify Auth Callback (Auth Success) - Update Modal`, () => {
  loadSettings.mockReturnValueOnce(Promise.resolve({}));
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
    expect(loadSettings).toBeCalled();
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

describe(`Spotify Auth Callback (Failed, Bad State etc) - Update Modal`, () => {
  loadSettings.mockReturnValueOnce(Promise.resolve({}));
  loadState.mockReturnValueOnce(Promise.resolve(`890023562052.879979449463.16085a5fc8fe42bb04003ab6c4379db1`));
  fetchProfile.mockImplementationOnce(() => Promise.resolve(authProfile));
  fetchAuthorizeURL.mockReturnValueOnce(Promise.resolve(`https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61`));
  updateModal.mockReturnValueOnce(Promise.resolve());
  loadView.mockReturnValueOnce(Promise.resolve({viewId: 'testViewId', trigger_id: 'testTriggerId'}));

  test('should update Slack Modal with authenticated settings panel', async () => {
    const response = await request(server)
        .get('/settings/auth/callback')
        .query({code: `AQBoCKqo7KOE242s8yNZS-URTwoDl_zA-JDRf3zZkAEjqjQTI_c5SDo_ZRYW1JqUsZo5vSbeJ31Lo-VbAki4loHTIbUs5lvH0VLSkbKwKn16vHoCMWhRRG7K-Xeta1zV__I84LSbT4Kjg4TuL9bjHclFy9vvnbXsOqes5zH2HoyjXfAmMtxom34DUpUx_MvMwzarSyeo4vs2ZqUb8EvoQI3uj0v1F8O8H_s2xHra9eIwGpLewunevrlDb25I0p_ieRViSpQ5ZfF-z-0K261sV-8E27YCCxma24F17bJ5CySqr-3cgfSDdGg7S4SSSm_o31Frpf-aoAh47XfVNOLAwCI4zq0w2wqQf7zZcHNcyh3MjfRaaT3q_HkCVBm-DO78Cz9WMfs0XJ8ok11-dK4JwZK04QkPPkkV4j0Li9driiDSJt49IJhrnjvUs05rRCTtMzAGavq0X42D54YPR-Rv6qn0Wi-MCpqTCXioQWOhgCWEz5t2Mf2I0tNfqvrXEORIKZ-tAH3xjg`, state: `890023562052.879979449463.16085a5fc8fe42bb04003ab6c4379`});
    expect(response.status).toEqual(401);
    expect(loadState).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(fetchAuthorizeURL).toBeCalled();
    expect(loadSettings).toBeCalled();
    expect(loadView).toBeCalled();
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
    expect(loadSettings).toBeCalled();
  });
});

describe(`Slack Block Action: Click 'Click to Reauthenticate' button`, () => {
  storeState.mockReturnValueOnce(Promise.resolve());
  storeTokens.mockReturnValueOnce(Promise.resolve());
  storePlaylistSetting.mockReturnValueOnce(Promise.resolve());
  storeDeviceSetting.mockReturnValueOnce(Promise.resolve());
  fetchProfile.mockImplementationOnce(() => Promise.resolve(authProfile));
  fetchAuthorizeURL.mockReturnValueOnce(Promise.resolve(`https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61`));
  updateModal.mockReturnValueOnce(Promise.resolve());
  loadSettings.mockReturnValueOnce(Promise.resolve({}));

  test('should update Slack Modal with unauthenticated settings panel', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: '{"type":"block_actions","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","container":{"type":"view","view_id":"VS6RAR39N"},"trigger_id":"879393310515.879979449463.edd18673fb8348c6ee8c1478ce6673ee","view":{"id":"VS6RAR39N","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{}},"hash":"1577932114.6b139fa1","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VS6RAR39N","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"},"actions":[{"action_id":"reauth","block_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth","type":"button","action_ts":"1577932117.204403"}]}'});
    expect(response.status).toEqual(200);
    expect(storeState).toBeCalled();
    expect(storeTokens).toBeCalled();
    expect(storePlaylistSetting).toBeCalled();
    expect(storeDeviceSetting).toBeCalled();
    expect(fetchAuthorizeURL).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(loadSettings).toBeCalled();
    expect(updateModal).toBeCalledWith('VS6RAR39N', {'blocks': [{'accessory': {'action_id': 'reauth', 'text': {'emoji': true, 'text': ':gear: Re-authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'value': 'reauth'}, 'block_id': 'reauth', 'text': {'text': 'Click to re-authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'auth_confirmation', 'elements': [{'text': ':white_check_mark: Authenticated with Test User - Spotify Premium', 'type': 'mrkdwn'}], 'type': 'context'}, {'block_id': 'slack_channel', 'element': {'action_id': 'slack_channel', 'type': 'channels_select'}, 'hint': {'text': 'The channel Slackbot will restrict usage of commands to.', 'type': 'plain_text'}, 'label': {'text': 'Slack Channel Restriction', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'playlist', 'element': {'action_id': 'playlist', 'min_query_length': 3, 'type': 'external_select'}, 'hint': {'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.', 'type': 'plain_text'}, 'label': {'text': 'Spotbot Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'default_device', 'element': {'action_id': 'default_device', 'min_query_length': 0, 'type': 'external_select'}, 'hint': {'text': 'This helps Spotbot with playing. Turn on your Spotify device now.', 'type': 'plain_text'}, 'label': {'text': 'Default Spotify Device', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'disable_repeats_duration', 'element': {'action_id': 'disable_repeats_duration', 'max_length': 5, 'placeholder': {'text': 'Enter a number eg. 4', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.', 'type': 'plain_text'}, 'label': {'text': 'Disable Repeats Duration (Hours)', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'back_to_playlist', 'element': {'action_id': 'back_to_playlist', 'options': [{'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, {'text': {'emoji': true, 'text': 'No', 'type': 'plain_text'}, 'value': 'false'}], 'type': 'static_select'}, 'hint': {'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).', 'type': 'plain_text'}, 'label': {'text': 'Jump Back to Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes', 'element': {'action_id': 'skip_votes', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 2', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes_ah', 'element': {'action_id': 'skip_votes_ah', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 0', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes - After Hours (6pm-6am)', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe(`Slash Command: /spotbot settings - saved settings`, () => {
  storeState.mockReturnValueOnce(Promise.resolve());
  fetchProfile.mockImplementationOnce(() => Promise.resolve(authProfile));
  fetchAuthorizeURL.mockReturnValueOnce(Promise.resolve(`https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61`));
  sendModal.mockReturnValueOnce(Promise.resolve());
  loadSettings.mockReturnValueOnce(Promise.resolve({
    slack_channel: 'CRU3H4MEC',
    playlist: {
      name: 'Test',
      url: 'https://open.spotify.com/playlist/099bxvxES7QkJtj4hrejhT',
      id: '099bxvxES7QkJtj4hrejhT',
    },
    default_device: {
      name: 'AU13282 - Computer',
      id: '87997bb4312981a00f1d8029eb874c55a211a0cc',
    },
    disable_repeats_duration: '4',
    back_to_playlist: 'true',
    skip_votes: '2',
    skip_votes_ah: '0',
  }));

  test('should open a modal settings panel in Slack with authentication', async () => {
    const response = await request(server)
        .post('/settings')
        .send(settingsCommand);
    expect(response.status).toEqual(200);
    expect(storeState).toBeCalled();
    expect(fetchAuthorizeURL).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(loadSettings).toBeCalled();
    expect(sendModal).toBeCalledWith('881543472007.879979449463.7384c6cf0d2df375824f431f7434df61', {'blocks': [{'accessory': {'action_id': 'reauth', 'text': {'emoji': true, 'text': ':gear: Re-authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'value': 'reauth'}, 'block_id': 'reauth', 'text': {'text': 'Click to re-authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'auth_confirmation', 'elements': [{'text': ':white_check_mark: Authenticated with Test User - Spotify Premium', 'type': 'mrkdwn'}], 'type': 'context'}, {'block_id': 'slack_channel', 'element': {'action_id': 'slack_channel', 'initial_channel': 'CRU3H4MEC', 'type': 'channels_select'}, 'hint': {'text': 'The channel Slackbot will restrict usage of commands to.', 'type': 'plain_text'}, 'label': {'text': 'Slack Channel Restriction', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'playlist', 'element': {'action_id': 'playlist', 'initial_option': {'text': {'emoji': true, 'text': 'Test', 'type': 'plain_text'}, 'value': '099bxvxES7QkJtj4hrejhT'}, 'min_query_length': 3, 'type': 'external_select'}, 'hint': {'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.', 'type': 'plain_text'}, 'label': {'text': 'Spotbot Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'default_device', 'element': {'action_id': 'default_device', 'initial_option': {'text': {'emoji': true, 'text': 'AU13282 - Computer', 'type': 'plain_text'}, 'value': '87997bb4312981a00f1d8029eb874c55a211a0cc'}, 'min_query_length': 0, 'type': 'external_select'}, 'hint': {'text': 'This helps Spotbot with playing. Turn on your Spotify device now.', 'type': 'plain_text'}, 'label': {'text': 'Default Spotify Device', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'disable_repeats_duration', 'element': {'action_id': 'disable_repeats_duration', 'initial_value': '4', 'max_length': 5, 'placeholder': {'text': 'Enter a number eg. 4', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.', 'type': 'plain_text'}, 'label': {'text': 'Disable Repeats Duration (Hours)', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'back_to_playlist', 'element': {'action_id': 'back_to_playlist', 'initial_option': {'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, 'options': [{'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, {'text': {'emoji': true, 'text': 'No', 'type': 'plain_text'}, 'value': 'false'}], 'type': 'static_select'}, 'hint': {'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).', 'type': 'plain_text'}, 'label': {'text': 'Jump Back to Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes', 'element': {'action_id': 'skip_votes', 'initial_value': '2', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 2', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes_ah', 'element': {'action_id': 'skip_votes_ah', 'initial_value': '0', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 0', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes - After Hours (6pm-6am)', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe('Submit a settings modal - no changes', () => {
  loadSettings.mockReturnValueOnce(Promise.resolve({
    slack_channel: 'CRU3H4MEC',
    playlist: {
      name: 'Spotbot',
      url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      id: '6TefVIS1ryrtEmjerqFu1N',
    },
    default_device: {
      name: 'DESKTOP-I7U2161 - Computer',
      id: '49433c0b9868f755ee05b5a58908f31c8d28faaf',
    },
    disable_repeats_duration: '4',
    back_to_playlist: 'true',
    skip_votes: '2',
    skip_votes_ah: '0',
  }));
  loadPlaylists.mockReturnValueOnce(Promise.resolve([
    {
      name: 'Spotbot',
      url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      id: '6TefVIS1ryrtEmjerqFu1N',
    },
    {
      name: 'Test',
      url: 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
      id: '2nuwjAGCHQiPabqGH6SLty',
    },
    {
      name: 'DOperatePlaylist',
      url: 'https://open.spotify.com/playlist/5DkqssdyTJyQzh3T0bLPTd',
      id: '5DkqssdyTJyQzh3T0bLPTd',
    },
    {
      name: 'Spring \'19',
      url: 'https://open.spotify.com/playlist/0AajTcIoODpnHr6m7JqE2Y',
      id: '0AajTcIoODpnHr6m7JqE2Y',
    },
    {
      name: 'Fall \'19',
      url: 'https://open.spotify.com/playlist/4lB2bRq79GWAd3jDyulDJ8',
      id: '4lB2bRq79GWAd3jDyulDJ8',
    },
    {
      name: 'Winter \'19',
      url: 'https://open.spotify.com/playlist/2M3YrO6fGfqz4bZHDnmnH5',
      id: '2M3YrO6fGfqz4bZHDnmnH5',
    },
    {
      name: 'Pure Joy',
      url: 'https://open.spotify.com/playlist/2j5o5jpPRtw2opTpHqMkXQ',
      id: '2j5o5jpPRtw2opTpHqMkXQ',
    },
    {
      name: 'Me',
      url: 'https://open.spotify.com/playlist/1J4m05bC5BKQPTwzxuzzz3',
      id: '1J4m05bC5BKQPTwzxuzzz3',
    },
    {
      name: 'SSSmas',
      url: 'https://open.spotify.com/playlist/0ykzkVbJFRPiUaacDJHCE2',
      id: '0ykzkVbJFRPiUaacDJHCE2',
    },
    {
      name: 'SSS BBQ',
      url: 'https://open.spotify.com/playlist/1n3tj3twqXHQhPWUiWthMm',
      id: '1n3tj3twqXHQhPWUiWthMm',
    },
    {
      name: '21',
      url: 'https://open.spotify.com/playlist/7Fv1AvTcY0jAbwzOmGJgHg',
      id: '7Fv1AvTcY0jAbwzOmGJgHg',
    },
    {
      name: 'Soundtracks',
      url: 'https://open.spotify.com/playlist/7atlhhcVVExUiKOMwXLNqU',
      id: '7atlhhcVVExUiKOMwXLNqU',
    },
    {
      name: 'Drunk Songs',
      url: 'https://open.spotify.com/playlist/1XueDduvvEIfEir2GJc8cG',
      id: '1XueDduvvEIfEir2GJc8cG',
    },
    {
      name: 'Test',
      url: 'https://open.spotify.com/playlist/099bxvxES7QkJtj4hrejhT',
      id: '099bxvxES7QkJtj4hrejhT',
    },
    {
      name: 'Musicals',
      url: 'https://open.spotify.com/playlist/2B4H5QMz7Jz07LWNzbWtqp',
      id: '2B4H5QMz7Jz07LWNzbWtqp',
    },
    {
      name: 'Liked from Radio',
      url: 'https://open.spotify.com/playlist/6DfnDtWIfXNBPLOLrTnRHt',
      id: '6DfnDtWIfXNBPLOLrTnRHt',
    },
    {
      name: 'My Shazam Tracks',
      url: 'https://open.spotify.com/playlist/1b1WGErHarH1cd3mH50IHO',
      id: '1b1WGErHarH1cd3mH50IHO',
    },
  ]));
  postEphemeral.mockReturnValueOnce(Promise.resolve());
  test('should successfully submit settings modal', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: '{"type":"view_submission","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","trigger_id":"894271242517.879979449463.06397d8a86668198eae0f942db97f540","view":{"id":"VRXE10402","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRU3H4MEC"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"DESKTOP-I7U2161 - Computer","emoji":true},"value":"49433c0b9868f755ee05b5a58908f31c8d28faaf"},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"4","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"2","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"0","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRU3H4MEC"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"DESKTOP-I7U2161 - Computer","emoji":true},"value":"49433c0b9868f755ee05b5a58908f31c8d28faaf"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"4"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"2"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"0"}}}},"hash":"1578293099.5872de4d","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VRXE10402","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}'});
    expect(response.status).toEqual(200);
    expect(loadSettings).toBeCalled();
    expect(loadPlaylists).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': 'CRU3H4MEC', 'text': ':white_check_mark: Settings successfully saved.', 'user': 'URVUTD7UP'});
  });
});

describe('Submit a settings modal - 1 change', () => {
  loadSettings.mockReturnValueOnce(Promise.resolve({
    slack_channel: 'CRU3H4MEC',
    playlist: {
      name: 'Spotbot',
      url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      id: '6TefVIS1ryrtEmjerqFu1N',
    },
    default_device: {
      name: 'DESKTOP-I7U2161 - Computer',
      id: '49433c0b9868f755ee05b5a58908f31c8d28faaf',
    },
    disable_repeats_duration: '4',
    back_to_playlist: 'true',
    skip_votes: '1',
    skip_votes_ah: '0',
  }));
  loadPlaylists.mockReturnValueOnce(Promise.resolve([
    {
      name: 'Spotbot',
      url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      id: '6TefVIS1ryrtEmjerqFu1N',
    },
    {
      name: 'Test',
      url: 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
      id: '2nuwjAGCHQiPabqGH6SLty',
    },
    {
      name: 'DOperatePlaylist',
      url: 'https://open.spotify.com/playlist/5DkqssdyTJyQzh3T0bLPTd',
      id: '5DkqssdyTJyQzh3T0bLPTd',
    },
    {
      name: 'Spring \'19',
      url: 'https://open.spotify.com/playlist/0AajTcIoODpnHr6m7JqE2Y',
      id: '0AajTcIoODpnHr6m7JqE2Y',
    },
    {
      name: 'Fall \'19',
      url: 'https://open.spotify.com/playlist/4lB2bRq79GWAd3jDyulDJ8',
      id: '4lB2bRq79GWAd3jDyulDJ8',
    },
    {
      name: 'Winter \'19',
      url: 'https://open.spotify.com/playlist/2M3YrO6fGfqz4bZHDnmnH5',
      id: '2M3YrO6fGfqz4bZHDnmnH5',
    },
    {
      name: 'Pure Joy',
      url: 'https://open.spotify.com/playlist/2j5o5jpPRtw2opTpHqMkXQ',
      id: '2j5o5jpPRtw2opTpHqMkXQ',
    },
    {
      name: 'Me',
      url: 'https://open.spotify.com/playlist/1J4m05bC5BKQPTwzxuzzz3',
      id: '1J4m05bC5BKQPTwzxuzzz3',
    },
    {
      name: 'SSSmas',
      url: 'https://open.spotify.com/playlist/0ykzkVbJFRPiUaacDJHCE2',
      id: '0ykzkVbJFRPiUaacDJHCE2',
    },
    {
      name: 'SSS BBQ',
      url: 'https://open.spotify.com/playlist/1n3tj3twqXHQhPWUiWthMm',
      id: '1n3tj3twqXHQhPWUiWthMm',
    },
    {
      name: '21',
      url: 'https://open.spotify.com/playlist/7Fv1AvTcY0jAbwzOmGJgHg',
      id: '7Fv1AvTcY0jAbwzOmGJgHg',
    },
    {
      name: 'Soundtracks',
      url: 'https://open.spotify.com/playlist/7atlhhcVVExUiKOMwXLNqU',
      id: '7atlhhcVVExUiKOMwXLNqU',
    },
    {
      name: 'Drunk Songs',
      url: 'https://open.spotify.com/playlist/1XueDduvvEIfEir2GJc8cG',
      id: '1XueDduvvEIfEir2GJc8cG',
    },
    {
      name: 'Test',
      url: 'https://open.spotify.com/playlist/099bxvxES7QkJtj4hrejhT',
      id: '099bxvxES7QkJtj4hrejhT',
    },
    {
      name: 'Musicals',
      url: 'https://open.spotify.com/playlist/2B4H5QMz7Jz07LWNzbWtqp',
      id: '2B4H5QMz7Jz07LWNzbWtqp',
    },
    {
      name: 'Liked from Radio',
      url: 'https://open.spotify.com/playlist/6DfnDtWIfXNBPLOLrTnRHt',
      id: '6DfnDtWIfXNBPLOLrTnRHt',
    },
    {
      name: 'My Shazam Tracks',
      url: 'https://open.spotify.com/playlist/1b1WGErHarH1cd3mH50IHO',
      id: '1b1WGErHarH1cd3mH50IHO',
    },
  ]));
  storeSettings.mockReturnValueOnce(Promise.resolve());
  postEphemeral.mockReturnValueOnce(Promise.resolve());
  test('should successfully submit settings modal', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: '{"type":"view_submission","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","trigger_id":"894271242517.879979449463.06397d8a86668198eae0f942db97f540","view":{"id":"VRXE10402","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRU3H4MEC"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"DESKTOP-I7U2161 - Computer","emoji":true},"value":"49433c0b9868f755ee05b5a58908f31c8d28faaf"},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"4","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"2","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"0","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRU3H4MEC"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"DESKTOP-I7U2161 - Computer","emoji":true},"value":"49433c0b9868f755ee05b5a58908f31c8d28faaf"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"4"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"2"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"0"}}}},"hash":"1578293099.5872de4d","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VRXE10402","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}'});
    expect(response.status).toEqual(200);
    expect(loadSettings).toBeCalled();
    expect(loadPlaylists).toBeCalled();
    expect(storeSettings).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': 'CRU3H4MEC', 'text': ':white_check_mark: Settings successfully saved.', 'user': 'URVUTD7UP'});
  });
});

describe('Submit a settings modal - default device change', () => {
  loadSettings.mockReturnValueOnce(Promise.resolve({
    slack_channel: 'CRU3H4MEC',
    playlist: {
      name: 'Spotbot',
      url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      id: '6TefVIS1ryrtEmjerqFu1N',
    },
    default_device: {
      name: 'AU13282 - Computer',
      id: '87997bb4312981a00f1d8029eb874c55a211a0cc',
    },
    disable_repeats_duration: '4',
    back_to_playlist: 'true',
    skip_votes: '1',
    skip_votes_ah: '0',
  }));
  loadPlaylists.mockReturnValueOnce(Promise.resolve([
    {
      name: 'Spotbot',
      url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      id: '6TefVIS1ryrtEmjerqFu1N',
    },
    {
      name: 'Test',
      url: 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
      id: '2nuwjAGCHQiPabqGH6SLty',
    },
    {
      name: 'DOperatePlaylist',
      url: 'https://open.spotify.com/playlist/5DkqssdyTJyQzh3T0bLPTd',
      id: '5DkqssdyTJyQzh3T0bLPTd',
    },
    {
      name: 'Spring \'19',
      url: 'https://open.spotify.com/playlist/0AajTcIoODpnHr6m7JqE2Y',
      id: '0AajTcIoODpnHr6m7JqE2Y',
    },
    {
      name: 'Fall \'19',
      url: 'https://open.spotify.com/playlist/4lB2bRq79GWAd3jDyulDJ8',
      id: '4lB2bRq79GWAd3jDyulDJ8',
    },
    {
      name: 'Winter \'19',
      url: 'https://open.spotify.com/playlist/2M3YrO6fGfqz4bZHDnmnH5',
      id: '2M3YrO6fGfqz4bZHDnmnH5',
    },
    {
      name: 'Pure Joy',
      url: 'https://open.spotify.com/playlist/2j5o5jpPRtw2opTpHqMkXQ',
      id: '2j5o5jpPRtw2opTpHqMkXQ',
    },
    {
      name: 'Me',
      url: 'https://open.spotify.com/playlist/1J4m05bC5BKQPTwzxuzzz3',
      id: '1J4m05bC5BKQPTwzxuzzz3',
    },
    {
      name: 'SSSmas',
      url: 'https://open.spotify.com/playlist/0ykzkVbJFRPiUaacDJHCE2',
      id: '0ykzkVbJFRPiUaacDJHCE2',
    },
    {
      name: 'SSS BBQ',
      url: 'https://open.spotify.com/playlist/1n3tj3twqXHQhPWUiWthMm',
      id: '1n3tj3twqXHQhPWUiWthMm',
    },
    {
      name: '21',
      url: 'https://open.spotify.com/playlist/7Fv1AvTcY0jAbwzOmGJgHg',
      id: '7Fv1AvTcY0jAbwzOmGJgHg',
    },
    {
      name: 'Soundtracks',
      url: 'https://open.spotify.com/playlist/7atlhhcVVExUiKOMwXLNqU',
      id: '7atlhhcVVExUiKOMwXLNqU',
    },
    {
      name: 'Drunk Songs',
      url: 'https://open.spotify.com/playlist/1XueDduvvEIfEir2GJc8cG',
      id: '1XueDduvvEIfEir2GJc8cG',
    },
    {
      name: 'Test',
      url: 'https://open.spotify.com/playlist/099bxvxES7QkJtj4hrejhT',
      id: '099bxvxES7QkJtj4hrejhT',
    },
    {
      name: 'Musicals',
      url: 'https://open.spotify.com/playlist/2B4H5QMz7Jz07LWNzbWtqp',
      id: '2B4H5QMz7Jz07LWNzbWtqp',
    },
    {
      name: 'Liked from Radio',
      url: 'https://open.spotify.com/playlist/6DfnDtWIfXNBPLOLrTnRHt',
      id: '6DfnDtWIfXNBPLOLrTnRHt',
    },
    {
      name: 'My Shazam Tracks',
      url: 'https://open.spotify.com/playlist/1b1WGErHarH1cd3mH50IHO',
      id: '1b1WGErHarH1cd3mH50IHO',
    },
  ]));
  loadDevices.mockReturnValueOnce(Promise.resolve([
    {
      name: 'DESKTOP-I7U2161 - Computer',
      id: '49433c0b9868f755ee05b5a58908f31c8d28faaf',
    },
    {
      name: 'AU13282 - Computer',
      id: '87997bb4312981a00f1d8029eb874c55a211a0cc',
    },
  ]));
  storeSettings.mockReturnValueOnce(Promise.resolve());
  postEphemeral.mockReturnValueOnce(Promise.resolve());
  test('should successfully submit settings modal', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: '{"type":"view_submission","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","trigger_id":"894271242517.879979449463.06397d8a86668198eae0f942db97f540","view":{"id":"VRXE10402","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRU3H4MEC"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"DESKTOP-I7U2161 - Computer","emoji":true},"value":"49433c0b9868f755ee05b5a58908f31c8d28faaf"},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"4","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"2","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"0","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRU3H4MEC"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"DESKTOP-I7U2161 - Computer","emoji":true},"value":"49433c0b9868f755ee05b5a58908f31c8d28faaf"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"4"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"2"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"0"}}}},"hash":"1578293099.5872de4d","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VRXE10402","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}'});
    expect(response.status).toEqual(200);
    expect(loadSettings).toBeCalled();
    expect(loadPlaylists).toBeCalled();
    expect(loadDevices).toBeCalled();
    expect(storeSettings).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': 'CRU3H4MEC', 'text': ':white_check_mark: Settings successfully saved.', 'user': 'URVUTD7UP'});
  });
});

describe('Submit a settings modal - default device changed', () => {
  loadSettings.mockReturnValueOnce(Promise.resolve({
    slack_channel: 'CRU3H4MEC',
    playlist: {
      name: 'Spotbot',
      url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      id: '6TefVIS1ryrtEmjerqFu1N',
    },
    default_device: {
      name: 'DESKTOP-I7U2161 - Computer',
      id: '49433c0b9868f755ee05b5a58908f31c8d28faaf',
    },
    disable_repeats_duration: '4',
    back_to_playlist: 'true',
    skip_votes: '2',
    skip_votes_ah: '0',
  }));
  loadPlaylists.mockReturnValueOnce(Promise.resolve([
    {
      name: 'Spotbot',
      url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      id: '6TefVIS1ryrtEmjerqFu1N',
    },
    {
      name: 'Test',
      url: 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
      id: '2nuwjAGCHQiPabqGH6SLty',
    },
    {
      name: 'DOperatePlaylist',
      url: 'https://open.spotify.com/playlist/5DkqssdyTJyQzh3T0bLPTd',
      id: '5DkqssdyTJyQzh3T0bLPTd',
    },
    {
      name: 'Spring \'19',
      url: 'https://open.spotify.com/playlist/0AajTcIoODpnHr6m7JqE2Y',
      id: '0AajTcIoODpnHr6m7JqE2Y',
    },
    {
      name: 'Fall \'19',
      url: 'https://open.spotify.com/playlist/4lB2bRq79GWAd3jDyulDJ8',
      id: '4lB2bRq79GWAd3jDyulDJ8',
    },
    {
      name: 'Winter \'19',
      url: 'https://open.spotify.com/playlist/2M3YrO6fGfqz4bZHDnmnH5',
      id: '2M3YrO6fGfqz4bZHDnmnH5',
    },
    {
      name: 'Pure Joy',
      url: 'https://open.spotify.com/playlist/2j5o5jpPRtw2opTpHqMkXQ',
      id: '2j5o5jpPRtw2opTpHqMkXQ',
    },
    {
      name: 'Me',
      url: 'https://open.spotify.com/playlist/1J4m05bC5BKQPTwzxuzzz3',
      id: '1J4m05bC5BKQPTwzxuzzz3',
    },
    {
      name: 'SSSmas',
      url: 'https://open.spotify.com/playlist/0ykzkVbJFRPiUaacDJHCE2',
      id: '0ykzkVbJFRPiUaacDJHCE2',
    },
    {
      name: 'SSS BBQ',
      url: 'https://open.spotify.com/playlist/1n3tj3twqXHQhPWUiWthMm',
      id: '1n3tj3twqXHQhPWUiWthMm',
    },
    {
      name: '21',
      url: 'https://open.spotify.com/playlist/7Fv1AvTcY0jAbwzOmGJgHg',
      id: '7Fv1AvTcY0jAbwzOmGJgHg',
    },
    {
      name: 'Soundtracks',
      url: 'https://open.spotify.com/playlist/7atlhhcVVExUiKOMwXLNqU',
      id: '7atlhhcVVExUiKOMwXLNqU',
    },
    {
      name: 'Drunk Songs',
      url: 'https://open.spotify.com/playlist/1XueDduvvEIfEir2GJc8cG',
      id: '1XueDduvvEIfEir2GJc8cG',
    },
    {
      name: 'Test',
      url: 'https://open.spotify.com/playlist/099bxvxES7QkJtj4hrejhT',
      id: '099bxvxES7QkJtj4hrejhT',
    },
    {
      name: 'Musicals',
      url: 'https://open.spotify.com/playlist/2B4H5QMz7Jz07LWNzbWtqp',
      id: '2B4H5QMz7Jz07LWNzbWtqp',
    },
    {
      name: 'Liked from Radio',
      url: 'https://open.spotify.com/playlist/6DfnDtWIfXNBPLOLrTnRHt',
      id: '6DfnDtWIfXNBPLOLrTnRHt',
    },
    {
      name: 'My Shazam Tracks',
      url: 'https://open.spotify.com/playlist/1b1WGErHarH1cd3mH50IHO',
      id: '1b1WGErHarH1cd3mH50IHO',
    },
  ]));
  postEphemeral.mockReturnValueOnce(Promise.resolve());
  test('should successfully submit settings modal', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: '{"type":"view_submission","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","trigger_id":"894271242517.879979449463.06397d8a86668198eae0f942db97f540","view":{"id":"VRXE10402","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRU3H4MEC"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"DESKTOP-I7U2161 - Computer","emoji":true},"value":"49433c0b9868f755ee05b5a58908f31c8d28faaf"},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"4","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"2","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"0","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRU3H4MEC"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"DESKTOP-I7U2161 - Computer","emoji":true},"value":"49433c0b9868f755ee05b5a58908f31c8d28faaf"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"4"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"2"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"0"}}}},"hash":"1578293099.5872de4d","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VRXE10402","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}'});
    expect(response.status).toEqual(200);
    expect(loadSettings).toBeCalled();
    expect(loadPlaylists).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': 'CRU3H4MEC', 'text': ':white_check_mark: Settings successfully saved.', 'user': 'URVUTD7UP'});
  });
});

describe('Submit a settings modal - handle error', () => {
  loadSettings.mockImplementationOnce(Promise.resolve([]));

  postEphemeral.mockReturnValueOnce(Promise.resolve());
  test('should post a failed response', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: '{"type":"view_submission","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","trigger_id":"894271242517.879979449463.06397d8a86668198eae0f942db97f540","view":{"id":"VRXE10402","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRU3H4MEC"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"DESKTOP-I7U2161 - Computer","emoji":true},"value":"49433c0b9868f755ee05b5a58908f31c8d28faaf"},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"4","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"2","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"0","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRU3H4MEC"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"DESKTOP-I7U2161 - Computer","emoji":true},"value":"49433c0b9868f755ee05b5a58908f31c8d28faaf"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"4"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"2"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"0"}}}},"hash":"1578293099.5872de4d","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VRXE10402","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}'});
    expect(response.status).toEqual(200);
    expect(loadSettings).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': 'CRU3H4MEC', 'text': ':x: Something went wrong! Settings were not saved.', 'user': 'URVUTD7UP'});
  });
});
