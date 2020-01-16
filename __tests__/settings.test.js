// require supertest
const server = require('../server/server').mockapp;
const request = require('supertest');
const {loadState, storeProfile, storeState, storeTokens} = require('../server/components/settings/spotifyauth/spotifyauth-dal');
const {fetchAuthorizeURL, fetchProfile, fetchTokens} = require('../server/components/spotify-api/spotify-api-auth');
const {loadDefaultDevice, loadDevices, loadPlaylists, loadPlaylistSetting, loadProfile, loadSettings, loadView, storeDevices, storeView, storeDeviceSetting, storePlaylistSetting, storeSettings, storePlaylists} = require('../server/components/settings/settings-dal');
const {postEphemeral, sendModal, updateModal} = require('../server/components/slack/slack-api');
const {AuthError} = require('../server/errors/errors-auth');
const {fetchPlaylists} = require('../server/components/spotify-api/spotify-api-playlists');
const {fetchDevices} = require('../server/components/spotify-api/spotify-api-devices');
jest.mock('../server/components/settings/spotifyauth/spotifyauth-dal');
jest.mock('../server/components/spotify-api/spotify-api-auth');
jest.mock('../server/components/slack/slack-api');
jest.mock('../server/components/settings/settings-dal');
jest.mock('../server/components/spotify-api/spotify-api-playlists');
jest.mock('../server/components/spotify-api/spotify-api-devices');


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
    expect(updateModal).toBeCalledWith('testViewId', {'blocks': [{'accessory': {'action_id': 'reauth', 'text': {'emoji': true, 'text': ':gear: Re-authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'value': 'reauth'}, 'block_id': 'reauth', 'text': {'text': 'Click to re-authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'auth_confirmation', 'elements': [{'text': ':white_check_mark: Authenticated with Test User - Spotify Premium', 'type': 'mrkdwn'}], 'type': 'context'}, {'block_id': 'slack_channel', 'element': {'action_id': 'slack_channel', 'type': 'channels_select'}, 'hint': {'text': 'The channel Slackbot will restrict usage of commands to.', 'type': 'plain_text'}, 'label': {'text': 'Slack Channel Restriction', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'playlist', 'element': {'action_id': 'playlist', 'min_query_length': 3, 'placeholder': {'text': 'Enter a playlist name', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.', 'type': 'plain_text'}, 'label': {'text': 'Spotbot Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'default_device', 'element': {'action_id': 'default_device', 'min_query_length': 0, 'placeholder': {'text': 'Pick an option', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'This helps Spotbot with playing. Turn on your Spotify device now.', 'type': 'plain_text'}, 'label': {'text': 'Default Spotify Device', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'disable_repeats_duration', 'element': {'action_id': 'disable_repeats_duration', 'max_length': 5, 'placeholder': {'text': 'Enter a number eg. 4', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.', 'type': 'plain_text'}, 'label': {'text': 'Disable Repeats Duration (Hours)', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'back_to_playlist', 'element': {'action_id': 'back_to_playlist', 'options': [{'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, {'text': {'emoji': true, 'text': 'No', 'type': 'plain_text'}, 'value': 'false'}], 'type': 'static_select'}, 'hint': {'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).', 'type': 'plain_text'}, 'label': {'text': 'Jump Back to Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'timezone', 'element': {'action_id': 'timezone', 'min_query_length': 3, 'placeholder': {'text': 'Find your timezone', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'This is to configure the time based skip votes. Type in a location.', 'type': 'plain_text'}, 'label': {'text': 'Timezone', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes', 'element': {'action_id': 'skip_votes', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 2', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes_ah', 'element': {'action_id': 'skip_votes_ah', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 0', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes - After Hours (6pm-6am)', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe(`Spotify Auth Callback (Failed, Bad State etc) - Update Modal`, () => {
  loadState.mockReturnValueOnce(Promise.resolve(`890023562052.879979449463.16085a5fc8fe42bb04003ab6c4379db1`));
  fetchProfile.mockImplementationOnce(() => Promise.reject(new AuthError('Auth Error')));
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
    expect(loadView).toBeCalled();
    expect(updateModal).toBeCalledWith('testViewId', {'blocks': [{'accessory': {'action_id': 'auth_url', 'text': {'emoji': true, 'text': ':link: Authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'url': 'https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61'}, 'block_id': 'auth_url', 'text': {'text': 'Click to authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'auth_error', 'elements': [{'text': ':x: Authentication failed with the Spotify. Please try again.', 'type': 'mrkdwn'}], 'type': 'context'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe('Slash Command: /spotbot settings - Authenticated', () => {
  storeState.mockReturnValueOnce(Promise.resolve());
  fetchAuthorizeURL.mockReturnValueOnce(Promise.resolve(`https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61`));
  fetchProfile.mockImplementationOnce(() => Promise.resolve(authProfile));
  loadSettings.mockReturnValueOnce(Promise.resolve({}));
  sendModal.mockReturnValueOnce(Promise.resolve());
  test('should open an authenticated Slack Modal', async () => {
    const response = await request(server)
        .post('/settings')
        .send(settingsCommand);
    expect(response.status).toEqual(200);
    expect(storeState).toBeCalled();
    expect(fetchAuthorizeURL).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(sendModal).toBeCalledWith('881543472007.879979449463.7384c6cf0d2df375824f431f7434df61', {'blocks': [{'accessory': {'action_id': 'reauth', 'text': {'emoji': true, 'text': ':gear: Re-authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'value': 'reauth'}, 'block_id': 'reauth', 'text': {'text': 'Click to re-authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'auth_confirmation', 'elements': [{'text': ':white_check_mark: Authenticated with Test User - Spotify Premium', 'type': 'mrkdwn'}], 'type': 'context'}, {'block_id': 'slack_channel', 'element': {'action_id': 'slack_channel', 'type': 'channels_select'}, 'hint': {'text': 'The channel Slackbot will restrict usage of commands to.', 'type': 'plain_text'}, 'label': {'text': 'Slack Channel Restriction', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'playlist', 'element': {'action_id': 'playlist', 'min_query_length': 3, 'placeholder': {'text': 'Enter a playlist name', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.', 'type': 'plain_text'}, 'label': {'text': 'Spotbot Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'default_device', 'element': {'action_id': 'default_device', 'min_query_length': 0, 'placeholder': {'text': 'Pick an option', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'This helps Spotbot with playing. Turn on your Spotify device now.', 'type': 'plain_text'}, 'label': {'text': 'Default Spotify Device', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'disable_repeats_duration', 'element': {'action_id': 'disable_repeats_duration', 'max_length': 5, 'placeholder': {'text': 'Enter a number eg. 4', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.', 'type': 'plain_text'}, 'label': {'text': 'Disable Repeats Duration (Hours)', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'back_to_playlist', 'element': {'action_id': 'back_to_playlist', 'options': [{'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, {'text': {'emoji': true, 'text': 'No', 'type': 'plain_text'}, 'value': 'false'}], 'type': 'static_select'}, 'hint': {'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).', 'type': 'plain_text'}, 'label': {'text': 'Jump Back to Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'timezone', 'element': {'action_id': 'timezone', 'min_query_length': 3, 'placeholder': {'text': 'Find your timezone', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'This is to configure the time based skip votes. Type in a location.', 'type': 'plain_text'}, 'label': {'text': 'Timezone', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes', 'element': {'action_id': 'skip_votes', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 2', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes_ah', 'element': {'action_id': 'skip_votes_ah', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 0', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes - After Hours (6pm-6am)', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
    expect(loadSettings).toBeCalled();
  });
});

describe(`Slack Block Action: Click 'Click to Reauthenticate' button`, () => {
  storeState.mockReturnValueOnce(Promise.resolve());
  storeTokens.mockReturnValueOnce(Promise.resolve());
  storePlaylistSetting.mockReturnValueOnce(Promise.resolve());
  storeDeviceSetting.mockReturnValueOnce(Promise.resolve());
  fetchProfile.mockImplementationOnce(() => Promise.reject(new AuthError('Auth Error')));
  fetchAuthorizeURL.mockReturnValueOnce(Promise.resolve(`https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61`));
  updateModal.mockReturnValueOnce(Promise.resolve());

  test('should update Slack Modal with unauthenticated settings panel', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: '{"type":"block_actions","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","container":{"type":"view","view_id":"VSGNRJ2KS"},"trigger_id":"890556408145.879979449463.904fbc4cadccd8488e89314f986ff834","view":{"id":"VSGNRJ2KS","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRVUTDP47"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","placeholder":{"type":"plain_text","text":"Enter a playlist name","emoji":true},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","placeholder":{"type":"plain_text","text":"Pick an option","emoji":true},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"4","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"timezone","label":{"type":"plain_text","text":"Timezone","emoji":true},"hint":{"type":"plain_text","text":"This is to configure the time based skip votes.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"timezone","initial_option":{"text":{"type":"plain_text","text":"Australia\/Melbourne","emoji":true},"value":"Australia\/Melbourne"},"placeholder":{"type":"plain_text","text":"Find your timezone","emoji":true},"min_query_length":3}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"2","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"0","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRVUTDP47"}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"4"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"timezone":{"timezone":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Australia\/Melbourne","emoji":true},"value":"Australia\/Melbourne"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"2"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"0"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"}}}}},"hash":"1578628029.cc6b8abf","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VSGNRJ2KS","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"},"actions":[{"action_id":"reauth","block_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth","type":"button","action_ts":"1578628031.894984"}]}'});
    expect(response.status).toEqual(200);
    expect(storeState).toBeCalled();
    expect(storeTokens).toBeCalled();
    expect(storePlaylistSetting).toBeCalled();
    expect(storeDeviceSetting).toBeCalled();
    expect(fetchAuthorizeURL).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(updateModal).toBeCalledWith('VSGNRJ2KS', {'blocks': [{'accessory': {'action_id': 'auth_url', 'text': {'emoji': true, 'text': ':link: Authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'url': 'https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61'}, 'block_id': 'auth_url', 'text': {'text': 'Click to authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe(`Slash Command: /spotbot settings - existing saved settings`, () => {
  storeState.mockReturnValueOnce(Promise.resolve());
  fetchProfile.mockImplementationOnce(() => Promise.resolve(authProfile));
  fetchAuthorizeURL.mockReturnValueOnce(Promise.resolve(`https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61`));
  sendModal.mockReturnValueOnce(Promise.resolve());
  loadSettings.mockReturnValueOnce(Promise.resolve({
    'slack_channel': 'CRU3H4MEC',
    'playlist': {
      name: 'Test',
      url: 'https://open.spotify.com/playlist/099bxvxES7QkJtj4hrejhT',
      id: '099bxvxES7QkJtj4hrejhT',
    },
    'default_device': {
      name: 'AU13282 - Computer',
      id: '87997bb4312981a00f1d8029eb874c55a211a0cc',
    },
    'timezone': 'Australia/Melbourne',
    'disable_repeats_duration': '4',
    'back_to_playlist': 'true',
    'skip_votes': '2',
    'skip_votes_ah': '0',
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
    expect(sendModal).toBeCalledWith('881543472007.879979449463.7384c6cf0d2df375824f431f7434df61', {'blocks': [{'accessory': {'action_id': 'reauth', 'text': {'emoji': true, 'text': ':gear: Re-authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'value': 'reauth'}, 'block_id': 'reauth', 'text': {'text': 'Click to re-authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'auth_confirmation', 'elements': [{'text': ':white_check_mark: Authenticated with Test User - Spotify Premium', 'type': 'mrkdwn'}], 'type': 'context'}, {'block_id': 'slack_channel', 'element': {'action_id': 'slack_channel', 'initial_channel': 'CRU3H4MEC', 'type': 'channels_select'}, 'hint': {'text': 'The channel Slackbot will restrict usage of commands to.', 'type': 'plain_text'}, 'label': {'text': 'Slack Channel Restriction', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'playlist', 'element': {'action_id': 'playlist', 'initial_option': {'text': {'emoji': true, 'text': 'Test', 'type': 'plain_text'}, 'value': '099bxvxES7QkJtj4hrejhT'}, 'min_query_length': 3, 'placeholder': {'text': 'Enter a playlist name', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.', 'type': 'plain_text'}, 'label': {'text': 'Spotbot Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'default_device', 'element': {'action_id': 'default_device', 'initial_option': {'text': {'emoji': true, 'text': 'AU13282 - Computer', 'type': 'plain_text'}, 'value': '87997bb4312981a00f1d8029eb874c55a211a0cc'}, 'min_query_length': 0, 'placeholder': {'text': 'Pick an option', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'This helps Spotbot with playing. Turn on your Spotify device now.', 'type': 'plain_text'}, 'label': {'text': 'Default Spotify Device', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'disable_repeats_duration', 'element': {'action_id': 'disable_repeats_duration', 'initial_value': '4', 'max_length': 5, 'placeholder': {'text': 'Enter a number eg. 4', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.', 'type': 'plain_text'}, 'label': {'text': 'Disable Repeats Duration (Hours)', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'back_to_playlist', 'element': {'action_id': 'back_to_playlist', 'initial_option': {'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, 'options': [{'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, {'text': {'emoji': true, 'text': 'No', 'type': 'plain_text'}, 'value': 'false'}], 'type': 'static_select'}, 'hint': {'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).', 'type': 'plain_text'}, 'label': {'text': 'Jump Back to Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'timezone', 'element': {'action_id': 'timezone', 'initial_option': {'text': {'emoji': true, 'text': 'Australia/Melbourne (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/Melbourne'}, 'min_query_length': 3, 'placeholder': {'text': 'Find your timezone', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'This is to configure the time based skip votes. Type in a location.', 'type': 'plain_text'}, 'label': {'text': 'Timezone', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes', 'element': {'action_id': 'skip_votes', 'initial_value': '2', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 2', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes_ah', 'element': {'action_id': 'skip_votes_ah', 'initial_value': '0', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 0', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes - After Hours (6pm-6am)', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe('Submit a settings modal - no changes', () => {
  loadSettings.mockReturnValueOnce(Promise.resolve({
    'slack_channel': 'CRU3H4MEC',
    'playlist': {
      name: 'Spotbot',
      url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      id: '6TefVIS1ryrtEmjerqFu1N',
    },
    'default_device': {
      name: 'DESKTOP-I7U2161 - Computer',
      id: '87997bb4312981a00f1d8029eb874c55a211a0cc',
    },
    'timezone': 'Australia/Melbourne',
    'disable_repeats_duration': '4',
    'back_to_playlist': 'true',
    'skip_votes': '2',
    'skip_votes_ah': '0',
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
        .send({payload: '{"type":"view_submission","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","trigger_id":"892534148066.879979449463.275cd3e42371ec6669381e4b02898717","view":{"id":"VSM9LM9K7","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRTKGH71S"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"placeholder":{"type":"plain_text","text":"Enter a playlist name","emoji":true},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"},"placeholder":{"type":"plain_text","text":"Pick an option","emoji":true},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"3","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"timezone","label":{"type":"plain_text","text":"Timezone","emoji":true},"hint":{"type":"plain_text","text":"This is to configure the time based skip votes. Type in a location.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"timezone","initial_option":{"text":{"type":"plain_text","text":"Australia\\/Melbourne (+11:00)","emoji":true},"value":"Australia\\/Melbourne"},"placeholder":{"type":"plain_text","text":"Find your timezone","emoji":true},"min_query_length":3}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"3","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"3","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRTKGH71S"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"3"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"timezone":{"timezone":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Australia\\/Melbourne (+11:00)","emoji":true},"value":"Australia\\/Melbourne"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"3"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"3"}}}},"hash":"1578993009.690ebf3f","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VSM9LM9K7","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}'});
    expect(response.status).toEqual(200);
    expect(loadSettings).toBeCalled();
    expect(loadPlaylists).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': 'CRTKGH71S', 'text': ':white_check_mark: Settings successfully saved.', 'user': 'URVUTD7UP'});
  });
});

describe('Submit a settings modal - 1 change', () => {
  loadSettings.mockReturnValueOnce(Promise.resolve({
    'slack_channel': 'CRU3H4MEC',
    'playlist': {
      name: 'Spotbot',
      url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      id: '6TefVIS1ryrtEmjerqFu1N',
    },
    'default_device': {
      name: 'DESKTOP-I7U2161 - Computer',
      id: '49433c0b9868f755ee05b5a58908f31c8d28faaf',
    },
    'timezone': 'Australia/Melbourne',
    'disable_repeats_duration': '4',
    'back_to_playlist': 'true',
    'skip_votes': '1',
    'skip_votes_ah': '0',
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
    {name: 'None', id: 'no_devices'},
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
        .send({payload: '{"type":"view_submission","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","trigger_id":"904877430212.879979449463.e74913ed7dd36030850370bd924fbd24","view":{"id":"VSM9TNBCY","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRTKGH71S"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"placeholder":{"type":"plain_text","text":"Enter a playlist name","emoji":true},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"None","emoji":true},"value":"no_devices"},"placeholder":{"type":"plain_text","text":"Pick an option","emoji":true},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"3","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"timezone","label":{"type":"plain_text","text":"Timezone","emoji":true},"hint":{"type":"plain_text","text":"This is to configure the time based skip votes. Type in a location.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"timezone","initial_option":{"text":{"type":"plain_text","text":"Australia\\/Melbourne (+11:00)","emoji":true},"value":"Australia\\/Melbourne"},"placeholder":{"type":"plain_text","text":"Find your timezone","emoji":true},"min_query_length":3}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"3","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"3","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRTKGH71S"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"3"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"timezone":{"timezone":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Australia\\/Melbourne (+11:00)","emoji":true},"value":"Australia\\/Melbourne"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"3"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"3"}}}},"hash":"1578993833.13424e67","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VSM9TNBCY","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}'});
    expect(response.status).toEqual(200);
    expect(loadSettings).toBeCalled();
    expect(loadPlaylists).toBeCalled();
    expect(storeSettings).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': 'CRTKGH71S', 'text': ':white_check_mark: Settings successfully saved.', 'user': 'URVUTD7UP'});
  });
});


describe('Submit a settings modal - handle error', () => {
  loadSettings.mockImplementationOnce(Promise.resolve([]));

  postEphemeral.mockReturnValueOnce(Promise.resolve());
  test('should post a failed response', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: '{"type":"view_submission","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","trigger_id":"889283514067.879979449463.e0a8ab7ad42c7895ed85345b02e3d3e8","view":{"id":"VS6FNNRLH","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRVUTDP47"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"placeholder":{"type":"plain_text","text":"Enter a playlist name","emoji":true},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"},"placeholder":{"type":"plain_text","text":"Pick an option","emoji":true},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"4","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"timezone","label":{"type":"plain_text","text":"Timezone","emoji":true},"hint":{"type":"plain_text","text":"This is to configure the time based skip votes.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"timezone","initial_option":{"text":{"type":"plain_text","text":"Australia/Melbourne","emoji":true},"value":"Australia/Melbourne"},"placeholder":{"type":"plain_text","text":"Find your timezone","emoji":true},"min_query_length":3}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"2","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"0","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRVUTDP47"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"4"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"timezone":{"timezone":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Australia/Melbourne","emoji":true},"value":"Australia/Melbourne"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"2"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"0"}}}},"hash":"1578625757.ebbb65c6","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VS6FNNRLH","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}'});
    expect(response.status).toEqual(200);
    expect(loadSettings).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': 'CRVUTDP47', 'text': ':x: Something went wrong! Settings were not saved.', 'user': 'URVUTD7UP'});
  });
});

describe('Get playlists options', () => {
  loadProfile.mockReturnValueOnce(Promise.resolve({country: 'AU', id: 'samchungy'}));
  fetchPlaylists.mockReturnValueOnce(Promise.resolve({
    'href': 'https://api.spotify.com/v1/users/samchungy/playlists?offset=0&limit=50',
    'items': [{
      'collaborative': true,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
      },
      'href': 'https://api.spotify.com/v1/playlists/6TefVIS1ryrtEmjerqFu1N',
      'id': '6TefVIS1ryrtEmjerqFu1N',
      'images': [],
      'name': 'Spotbot',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MywyMTI5ZGJkMTZmZjZjMzk4NGMxZjkyMTg3MDU1ZWMyYzU1YjBkZWI5',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/6TefVIS1ryrtEmjerqFu1N/tracks',
        'total': 0,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:6TefVIS1ryrtEmjerqFu1N',
    }, {
      'collaborative': true,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
      },
      'href': 'https://api.spotify.com/v1/playlists/2nuwjAGCHQiPabqGH6SLty',
      'id': '2nuwjAGCHQiPabqGH6SLty',
      'images': [{
        'height': 640,
        'url': 'https://i.scdn.co/image/63da45aa38043088c347243cafdb48aeb62d1b02',
        'width': 640,
      }],
      'name': 'Test',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'Miw1OGNiM2MyMDdhNzE5ZTRkZTQ4NWY1NTIzM2IyNmI1NGNmMWE5MDBm',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/2nuwjAGCHQiPabqGH6SLty/tracks',
        'total': 1,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty',
    }, {
      'collaborative': false,
      'description': 'The songs you loved most this year, all wrapped up.',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/37i9dQZF1Et8QOtLl2E6HD',
      },
      'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1Et8QOtLl2E6HD',
      'id': '37i9dQZF1Et8QOtLl2E6HD',
      'images': [{
        'height': null,
        'url': 'https://lineup-images.scdn.co/your-top-songs-2019_DEFAULT-en.jpg',
        'width': null,
      }],
      'name': 'Your Top Songs 2019',
      'owner': {
        'display_name': 'Spotify',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/spotify',
        },
        'href': 'https://api.spotify.com/v1/users/spotify',
        'id': 'spotify',
        'type': 'user',
        'uri': 'spotify:user:spotify',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MjYyNjk4MDQsMDAwMDAwMDA0NWU4MzU0MGVhMDJiMTQ5MmM4OTUyMGEyZGU2MjU5MA==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1Et8QOtLl2E6HD/tracks',
        'total': 100,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:37i9dQZF1Et8QOtLl2E6HD',
    }, {
      'collaborative': true,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/5DkqssdyTJyQzh3T0bLPTd',
      },
      'href': 'https://api.spotify.com/v1/playlists/5DkqssdyTJyQzh3T0bLPTd',
      'id': '5DkqssdyTJyQzh3T0bLPTd',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/35605fb453cf54d93d3d01af4233ca8d632090af86d7e68661e4d23921df6f921f3b34d34f54bc729f264637b964acdf6388562d174c26007509c381ab67616d0000b273e8db4c7ffc676621da8dbcca',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/35605fb453cf54d93d3d01af4233ca8d632090af86d7e68661e4d23921df6f921f3b34d34f54bc729f264637b964acdf6388562d174c26007509c381ab67616d0000b273e8db4c7ffc676621da8dbcca',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/35605fb453cf54d93d3d01af4233ca8d632090af86d7e68661e4d23921df6f921f3b34d34f54bc729f264637b964acdf6388562d174c26007509c381ab67616d0000b273e8db4c7ffc676621da8dbcca',
        'width': 60,
      }],
      'name': 'DOperatePlaylist',
      'owner': {
        'display_name': 'DPE Ops',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/gmom8jiyb0bjugwah1nn12irr',
        },
        'href': 'https://api.spotify.com/v1/users/gmom8jiyb0bjugwah1nn12irr',
        'id': 'gmom8jiyb0bjugwah1nn12irr',
        'type': 'user',
        'uri': 'spotify:user:gmom8jiyb0bjugwah1nn12irr',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MzIwNCwyZGQzZmFlODkxNTQ1YzkxOWM3NGE5MGU4Yjc0YWFiNGMwMDE0YzFm',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/5DkqssdyTJyQzh3T0bLPTd/tracks',
        'total': 131,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:5DkqssdyTJyQzh3T0bLPTd',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/0AajTcIoODpnHr6m7JqE2Y',
      },
      'href': 'https://api.spotify.com/v1/playlists/0AajTcIoODpnHr6m7JqE2Y',
      'id': '0AajTcIoODpnHr6m7JqE2Y',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/aa0da1d1bf489769da401b227c392949f8db409dab67616d0000b27382fb86675a15663c8d3caebcab67616d0000b273b7f72643bf8a029abeacc5ddab67616d0000b273c8a851625a978bb17601462e',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/aa0da1d1bf489769da401b227c392949f8db409dab67616d0000b27382fb86675a15663c8d3caebcab67616d0000b273b7f72643bf8a029abeacc5ddab67616d0000b273c8a851625a978bb17601462e',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/aa0da1d1bf489769da401b227c392949f8db409dab67616d0000b27382fb86675a15663c8d3caebcab67616d0000b273b7f72643bf8a029abeacc5ddab67616d0000b273c8a851625a978bb17601462e',
        'width': 60,
      }],
      'name': 'Spring \'19',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': true,
      'snapshot_id': 'Myw5MzhiYjBmOWIxYWJmZDU0Y2I5ODZhZmQ1MGM4NjM2NTJjMTYyYzE5',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/0AajTcIoODpnHr6m7JqE2Y/tracks',
        'total': 42,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:0AajTcIoODpnHr6m7JqE2Y',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/4lB2bRq79GWAd3jDyulDJ8',
      },
      'href': 'https://api.spotify.com/v1/playlists/4lB2bRq79GWAd3jDyulDJ8',
      'id': '4lB2bRq79GWAd3jDyulDJ8',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/ab67616d0000b273437d60f35824aee69d8f505bab67616d0000b273601f8a9b56967a0fd9cd5f6dab67616d0000b273653cd998d5560350e96655eaab67616d0000b273d6c1fc498c44d13b41a7bbe5',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/ab67616d0000b273437d60f35824aee69d8f505bab67616d0000b273601f8a9b56967a0fd9cd5f6dab67616d0000b273653cd998d5560350e96655eaab67616d0000b273d6c1fc498c44d13b41a7bbe5',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/ab67616d0000b273437d60f35824aee69d8f505bab67616d0000b273601f8a9b56967a0fd9cd5f6dab67616d0000b273653cd998d5560350e96655eaab67616d0000b273d6c1fc498c44d13b41a7bbe5',
        'width': 60,
      }],
      'name': 'Fall \'19',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': true,
      'snapshot_id': 'NDksYTYzOTdmZDlkMzFiMTNiODI1NDdiNTQzMzYzYjI4NTllNzdlM2JhNg==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/4lB2bRq79GWAd3jDyulDJ8/tracks',
        'total': 48,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:4lB2bRq79GWAd3jDyulDJ8',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/2M3YrO6fGfqz4bZHDnmnH5',
      },
      'href': 'https://api.spotify.com/v1/playlists/2M3YrO6fGfqz4bZHDnmnH5',
      'id': '2M3YrO6fGfqz4bZHDnmnH5',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/ab67616d0000b2732ea43a2351fb6a2a9964395fab67616d0000b2738b32b139981e79f2ebe005ebab67616d0000b273b35a97f364865a2cb4e5a194ab67616d0000b273dbd83e179619408e5d05cc99',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/ab67616d0000b2732ea43a2351fb6a2a9964395fab67616d0000b2738b32b139981e79f2ebe005ebab67616d0000b273b35a97f364865a2cb4e5a194ab67616d0000b273dbd83e179619408e5d05cc99',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/ab67616d0000b2732ea43a2351fb6a2a9964395fab67616d0000b2738b32b139981e79f2ebe005ebab67616d0000b273b35a97f364865a2cb4e5a194ab67616d0000b273dbd83e179619408e5d05cc99',
        'width': 60,
      }],
      'name': 'Winter \'19',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': true,
      'snapshot_id': 'NDMsYWM2NzVmNjUxZWU0NDYwMzE0OGE3MWQ5NDE1NmE1Y2Q1MTVjZWY1YQ==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/2M3YrO6fGfqz4bZHDnmnH5/tracks',
        'total': 41,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:2M3YrO6fGfqz4bZHDnmnH5',
    }, {
      'collaborative': false,
      'description': 'An eclectic mix of tunes to throw on while chilling with friends or gearing up to head out.',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/37i9dQZF1DX2hL79MX8oXQ',
      },
      'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1DX2hL79MX8oXQ',
      'id': '37i9dQZF1DX2hL79MX8oXQ',
      'images': [{
        'height': null,
        'url': 'https://i.scdn.co/image/ab67706f000000025ed24a2863306319f9faa8a7',
        'width': null,
      }],
      'name': 'Weekends + Friends',
      'owner': {
        'display_name': 'Spotify',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/spotify',
        },
        'href': 'https://api.spotify.com/v1/users/spotify',
        'id': 'spotify',
        'type': 'user',
        'uri': 'spotify:user:spotify',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MTU3ODY0NzA2OSwwMDAwMDAwMGQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0Mjdl',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1DX2hL79MX8oXQ/tracks',
        'total': 80,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:37i9dQZF1DX2hL79MX8oXQ',
    }, {
      'collaborative': false,
      'description': 'ALT the Good Vibes.',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/37i9dQZF1DX2SK4ytI2KAZ',
      },
      'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1DX2SK4ytI2KAZ',
      'id': '37i9dQZF1DX2SK4ytI2KAZ',
      'images': [{
        'height': null,
        'url': 'https://i.scdn.co/image/ab67706f0000000247cd5a0f1c493c1f809cdeec',
        'width': null,
      }],
      'name': 'It\'s ALT Good!',
      'owner': {
        'display_name': 'Spotify',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/spotify',
        },
        'href': 'https://api.spotify.com/v1/users/spotify',
        'id': 'spotify',
        'type': 'user',
        'uri': 'spotify:user:spotify',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MTU3ODY0NzA2OSwwMDAwMDAwMGQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0Mjdl',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1DX2SK4ytI2KAZ/tracks',
        'total': 100,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:37i9dQZF1DX2SK4ytI2KAZ',
    }, {
      'collaborative': false,
      'description': 'Spilt Milk 2019 line up 💛 <a href="http://bit.ly/spiltmilkau">spilt-milk.com.au</a>',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/5WyzeOpJy8ZNZrDZwuQWWo',
      },
      'href': 'https://api.spotify.com/v1/playlists/5WyzeOpJy8ZNZrDZwuQWWo',
      'id': '5WyzeOpJy8ZNZrDZwuQWWo',
      'images': [{
        'height': null,
        'url': 'https://pl.scdn.co/images/pl/default/5aae5aa64f2f855589220b345f71f89e231e616b',
        'width': null,
      }],
      'name': 'Spilt Milk 2019',
      'owner': {
        'display_name': 'Spilt Milk',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/kicks.entertainment',
        },
        'href': 'https://api.spotify.com/v1/users/kicks.entertainment',
        'id': 'kicks.entertainment',
        'type': 'user',
        'uri': 'spotify:user:kicks.entertainment',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'Mzc0LGY2MWQxYTg2M2JiMDk2YTUzMGE4NDAwMTUzZjcxMjhjMDlkNmY3ZmI=',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/5WyzeOpJy8ZNZrDZwuQWWo/tracks',
        'total': 134,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:5WyzeOpJy8ZNZrDZwuQWWo',
    }, {
      'collaborative': false,
      'description': 'Line-up is out! Sign up for the presale! http://fallsfe.st/FallsFestivalPresale',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/58Ulu1LFsHSuNHV9j4E4VT',
      },
      'href': 'https://api.spotify.com/v1/playlists/58Ulu1LFsHSuNHV9j4E4VT',
      'id': '58Ulu1LFsHSuNHV9j4E4VT',
      'images': [{
        'height': null,
        'url': 'https://pl.scdn.co/images/pl/default/c0592b04c25e873ba88dae8c1b00ad3bc5849bde',
        'width': null,
      }],
      'name': 'Falls Festival 2019/20 Lineup Playlist',
      'owner': {
        'display_name': 'Falls Festival',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/fallsfestival',
        },
        'href': 'https://api.spotify.com/v1/users/fallsfestival',
        'id': 'fallsfestival',
        'type': 'user',
        'uri': 'spotify:user:fallsfestival',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MjU4LGVjNjlmOTk0NzQzYzMwNzQyYzZhMWNkMWQ3OTI2OTQxYWU0YTFkMzA=',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/58Ulu1LFsHSuNHV9j4E4VT/tracks',
        'total': 40,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:58Ulu1LFsHSuNHV9j4E4VT',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/2j5o5jpPRtw2opTpHqMkXQ',
      },
      'href': 'https://api.spotify.com/v1/playlists/2j5o5jpPRtw2opTpHqMkXQ',
      'id': '2j5o5jpPRtw2opTpHqMkXQ',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/63da45aa38043088c347243cafdb48aeb62d1b02ab67616d0000b273280a72fdd9bd502bcba6ada8ab67616d0000b273a2b1d3e73c66663c01351bcfab67616d0000b273c986b354b39294bad3705476',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/63da45aa38043088c347243cafdb48aeb62d1b02ab67616d0000b273280a72fdd9bd502bcba6ada8ab67616d0000b273a2b1d3e73c66663c01351bcfab67616d0000b273c986b354b39294bad3705476',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/63da45aa38043088c347243cafdb48aeb62d1b02ab67616d0000b273280a72fdd9bd502bcba6ada8ab67616d0000b273a2b1d3e73c66663c01351bcfab67616d0000b273c986b354b39294bad3705476',
        'width': 60,
      }],
      'name': 'Pure Joy',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': true,
      'snapshot_id': 'MjcsYjU2Y2UxMTk3ZjlhMTQwZTcxMDJkNjhjYjU1ODUwNjg5NzJkOGIwZg==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/2j5o5jpPRtw2opTpHqMkXQ/tracks',
        'total': 11,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:2j5o5jpPRtw2opTpHqMkXQ',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/1J4m05bC5BKQPTwzxuzzz3',
      },
      'href': 'https://api.spotify.com/v1/playlists/1J4m05bC5BKQPTwzxuzzz3',
      'id': '1J4m05bC5BKQPTwzxuzzz3',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/ab67616d0000b27371e7c421adfb27ed2ed15432ab67616d0000b273c6f12950c0baa55f7133b6edab67616d0000b273d8b44ee2b3636fd5e9287eacab67616d0000b273f539f9a64d5603185f70e02b',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/ab67616d0000b27371e7c421adfb27ed2ed15432ab67616d0000b273c6f12950c0baa55f7133b6edab67616d0000b273d8b44ee2b3636fd5e9287eacab67616d0000b273f539f9a64d5603185f70e02b',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/ab67616d0000b27371e7c421adfb27ed2ed15432ab67616d0000b273c6f12950c0baa55f7133b6edab67616d0000b273d8b44ee2b3636fd5e9287eacab67616d0000b273f539f9a64d5603185f70e02b',
        'width': 60,
      }],
      'name': 'Me',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': true,
      'snapshot_id': 'NjksY2Y0YTk0MTRmZDRkY2Y0OGZkMWEyNmYwYTIyY2Q2N2FmNjA5ZDExMw==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/1J4m05bC5BKQPTwzxuzzz3/tracks',
        'total': 62,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:1J4m05bC5BKQPTwzxuzzz3',
    }, {
      'collaborative': false,
      'description': 'We made you a personalized playlist with songs to take you back in time.',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/37i9dQZF1E4K0Sj65GDqyY',
      },
      'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1E4K0Sj65GDqyY',
      'id': '37i9dQZF1E4K0Sj65GDqyY',
      'images': [{
        'height': null,
        'url': 'https://lineup-images.scdn.co/time-capsule_DEFAULT-en.jpg',
        'width': null,
      }],
      'name': 'Your Time Capsule',
      'owner': {
        'display_name': 'Spotify',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/spotify',
        },
        'href': 'https://api.spotify.com/v1/users/spotify',
        'id': 'spotify',
        'type': 'user',
        'uri': 'spotify:user:spotify',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MjUxMTAzNzYsMDAwMDAwMDAzN2RjNzY3NTg5ODdjNzkyYTE2MzBlZDA5MmVlNWY0ZQ==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1E4K0Sj65GDqyY/tracks',
        'total': 55,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:37i9dQZF1E4K0Sj65GDqyY',
    }, {
      'collaborative': false,
      'description': 'Keep up-to-date with the newest music to hit the airwaves',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/7vFQNWXoblEJXpbnTuyz76',
      },
      'href': 'https://api.spotify.com/v1/playlists/7vFQNWXoblEJXpbnTuyz76',
      'id': '7vFQNWXoblEJXpbnTuyz76',
      'images': [{
        'height': null,
        'url': 'https://pl.scdn.co/images/pl/default/22ca978dfff5cadf4c38680f46fc98f50f57fe8c',
        'width': null,
      }],
      'name': 'triple j Hitlist',
      'owner': {
        'display_name': 'Triple J',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/triple.j.abc',
        },
        'href': 'https://api.spotify.com/v1/users/triple.j.abc',
        'id': 'triple.j.abc',
        'type': 'user',
        'uri': 'spotify:user:triple.j.abc',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MzQxOCxlMDdmMmM3MmQzNDRmNDU5ZGRlZWJmNjNkOWJlNjI1NDUzNjIyM2Zk',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/7vFQNWXoblEJXpbnTuyz76/tracks',
        'total': 200,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:7vFQNWXoblEJXpbnTuyz76',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/785kqQ23rZG2KBj1q4UUwe',
      },
      'href': 'https://api.spotify.com/v1/playlists/785kqQ23rZG2KBj1q4UUwe',
      'id': '785kqQ23rZG2KBj1q4UUwe',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/ab67616d0000b273a89d3d090fdbc89ec8b5658eab67616d0000b273c7df429d9ef2242bfac00656b101c5a752e4edd9db1d3ca8e4c45467bc4f9022bf48d36b5600ec0e7414f716e4766c2b0315f5d9',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/ab67616d0000b273a89d3d090fdbc89ec8b5658eab67616d0000b273c7df429d9ef2242bfac00656b101c5a752e4edd9db1d3ca8e4c45467bc4f9022bf48d36b5600ec0e7414f716e4766c2b0315f5d9',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/ab67616d0000b273a89d3d090fdbc89ec8b5658eab67616d0000b273c7df429d9ef2242bfac00656b101c5a752e4edd9db1d3ca8e4c45467bc4f9022bf48d36b5600ec0e7414f716e4766c2b0315f5d9',
        'width': 60,
      }],
      'name': 'H E A T W A V E',
      'owner': {
        'display_name': 'James Luke',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/1231540952',
        },
        'href': 'https://api.spotify.com/v1/users/1231540952',
        'id': '1231540952',
        'type': 'user',
        'uri': 'spotify:user:1231540952',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'Myw1YTk2Nzc3ZmFiOGM5YWJmZWZhZTBhNWVmM2QyNTdkYWFlOGJlY2U5',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/785kqQ23rZG2KBj1q4UUwe/tracks',
        'total': 287,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:785kqQ23rZG2KBj1q4UUwe',
    }, {
      'collaborative': true,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/0ykzkVbJFRPiUaacDJHCE2',
      },
      'href': 'https://api.spotify.com/v1/playlists/0ykzkVbJFRPiUaacDJHCE2',
      'id': '0ykzkVbJFRPiUaacDJHCE2',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/0ec9921251cd8b6888672597a21731524a546b778e077f377d0144b31ec616bdac2f41f37d8e21d3ab67616d0000b273673d6a2831f72e48745ea80dab67616d0000b273737c534dee320650a8f8f850',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/0ec9921251cd8b6888672597a21731524a546b778e077f377d0144b31ec616bdac2f41f37d8e21d3ab67616d0000b273673d6a2831f72e48745ea80dab67616d0000b273737c534dee320650a8f8f850',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/0ec9921251cd8b6888672597a21731524a546b778e077f377d0144b31ec616bdac2f41f37d8e21d3ab67616d0000b273673d6a2831f72e48745ea80dab67616d0000b273737c534dee320650a8f8f850',
        'width': 60,
      }],
      'name': 'SSSmas',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'NDYsZjk0YzIwYzI3OTMzNGQxYzRlNDA5ZTZiNDZlMTk3NTdlYTc3MDllNQ==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/0ykzkVbJFRPiUaacDJHCE2/tracks',
        'total': 34,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:0ykzkVbJFRPiUaacDJHCE2',
    }, {
      'collaborative': true,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/1n3tj3twqXHQhPWUiWthMm',
      },
      'href': 'https://api.spotify.com/v1/playlists/1n3tj3twqXHQhPWUiWthMm',
      'id': '1n3tj3twqXHQhPWUiWthMm',
      'images': [{
        'height': null,
        'url': 'https://pl.scdn.co/images/pl/default/81d1d211eae0eb5d8711b9e7508c7f347d97d308',
        'width': null,
      }],
      'name': 'SSS BBQ',
      'owner': {
        'display_name': 'Lilly Townsend',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/lillytownsend',
        },
        'href': 'https://api.spotify.com/v1/users/lillytownsend',
        'id': 'lillytownsend',
        'type': 'user',
        'uri': 'spotify:user:lillytownsend',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'ODIzLGU1MzRlOTNiZGE1YzQ1NDU5ODkzY2NkNmQ4NmNjMzU1NDc2NDk2Njk=',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/1n3tj3twqXHQhPWUiWthMm/tracks',
        'total': 96,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:1n3tj3twqXHQhPWUiWthMm',
    }, {
      'collaborative': false,
      'description': 'Never miss a new release! Catch all the latest music from artists you follow, plus new singles picked just for you. Updates every Friday.',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/37i9dQZEVXbxilFl77PwUa',
      },
      'href': 'https://api.spotify.com/v1/playlists/37i9dQZEVXbxilFl77PwUa',
      'id': '37i9dQZEVXbxilFl77PwUa',
      'images': [{
        'height': 300,
        'url': 'https://i.scdn.co/image/15257888e3e25c93e436ecdc3368a5fa8184e14e',
        'width': 300,
      }],
      'name': 'Release Radar',
      'owner': {
        'display_name': 'Spotify',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/spotify',
        },
        'href': 'https://api.spotify.com/v1/users/spotify',
        'id': 'spotify',
        'type': 'user',
        'uri': 'spotify:user:spotify',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MjYzMDk1ODAsMDAwMDAwMDAwNWI0Yzg3NzMwY2ZiZjgwYjkyMmQ4MmYyODBhMTdmNw==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/37i9dQZEVXbxilFl77PwUa/tracks',
        'total': 30,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:37i9dQZEVXbxilFl77PwUa',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/7Fv1AvTcY0jAbwzOmGJgHg',
      },
      'href': 'https://api.spotify.com/v1/playlists/7Fv1AvTcY0jAbwzOmGJgHg',
      'id': '7Fv1AvTcY0jAbwzOmGJgHg',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/1ceb8b5a3db90cca4eec22ffe44a4a555698c1659dd527eef9cb6777a18f269619f5d982acd38cfaab67616d0000b2732dcab535e36e69ef25239ddaab67616d0000b273f2084e0d4647cef727061f38',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/1ceb8b5a3db90cca4eec22ffe44a4a555698c1659dd527eef9cb6777a18f269619f5d982acd38cfaab67616d0000b2732dcab535e36e69ef25239ddaab67616d0000b273f2084e0d4647cef727061f38',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/1ceb8b5a3db90cca4eec22ffe44a4a555698c1659dd527eef9cb6777a18f269619f5d982acd38cfaab67616d0000b2732dcab535e36e69ef25239ddaab67616d0000b273f2084e0d4647cef727061f38',
        'width': 60,
      }],
      'name': '21',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'NDUsYTlhMWVmNWVmOTQzY2U4MTMxNjNlODk4Mzc2M2M1YTNjZTEzNjkwYQ==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/7Fv1AvTcY0jAbwzOmGJgHg/tracks',
        'total': 99,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:7Fv1AvTcY0jAbwzOmGJgHg',
    }, {
      'collaborative': false,
      'description': 'This is The Wombats. The essential tracks, all in one playlist.',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/37i9dQZF1DZ06evO0vIZz2',
      },
      'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1DZ06evO0vIZz2',
      'id': '37i9dQZF1DZ06evO0vIZz2',
      'images': [{
        'height': null,
        'url': 'https://thisis-images.scdn.co/37i9dQZF1DZ06evO0vIZz2-default.jpg',
        'width': null,
      }],
      'name': 'This Is The Wombats',
      'owner': {
        'display_name': 'Spotify',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/spotify',
        },
        'href': 'https://api.spotify.com/v1/users/spotify',
        'id': 'spotify',
        'type': 'user',
        'uri': 'spotify:user:spotify',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MjYzMTAyNjIsMDAwMDAwMDA0ZGRhM2JlZjYxMGVlZTY1ZGM4YzI3YTFmM2IxOTkzZA==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/37i9dQZF1DZ06evO0vIZz2/tracks',
        'total': 42,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:37i9dQZF1DZ06evO0vIZz2',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/7atlhhcVVExUiKOMwXLNqU',
      },
      'href': 'https://api.spotify.com/v1/playlists/7atlhhcVVExUiKOMwXLNqU',
      'id': '7atlhhcVVExUiKOMwXLNqU',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/760266c248f217e188148fa3bb5df8506c6741008c756d4b154fac51cc5bd268b32d7020f44422bea3e1266d1bffa10cb589cce5c6776a2a74002dfbab67616d0000b2733c9a2796a76dd44f3ce921f9',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/760266c248f217e188148fa3bb5df8506c6741008c756d4b154fac51cc5bd268b32d7020f44422bea3e1266d1bffa10cb589cce5c6776a2a74002dfbab67616d0000b2733c9a2796a76dd44f3ce921f9',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/760266c248f217e188148fa3bb5df8506c6741008c756d4b154fac51cc5bd268b32d7020f44422bea3e1266d1bffa10cb589cce5c6776a2a74002dfbab67616d0000b2733c9a2796a76dd44f3ce921f9',
        'width': 60,
      }],
      'name': 'Soundtracks',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MjEsNDE2M2I2MmI5YTc5MWU2Yzg1YzEwYWM0MmM5N2NjZmJkNDhlYTJjOA==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/7atlhhcVVExUiKOMwXLNqU/tracks',
        'total': 19,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:7atlhhcVVExUiKOMwXLNqU',
    }, {
      'collaborative': false,
      'description': 'Your weekly mixtape of fresh music. Enjoy new discoveries and deep cuts chosen just for you. Updated every Monday, so save your favorites!',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/37i9dQZEVXcE93aFOsdi7J',
      },
      'href': 'https://api.spotify.com/v1/playlists/37i9dQZEVXcE93aFOsdi7J',
      'id': '37i9dQZEVXcE93aFOsdi7J',
      'images': [{
        'height': null,
        'url': 'https://pl.scdn.co/images/pl/default/32b6bc7fb8d4ed6703cf935ca5411ffa579aca1c',
        'width': null,
      }],
      'name': 'Discover Weekly',
      'owner': {
        'display_name': 'Spotify',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/spotify',
        },
        'href': 'https://api.spotify.com/v1/users/spotify',
        'id': 'spotify',
        'type': 'user',
        'uri': 'spotify:user:spotify',
      },
      'primary_color': null,
      'public': true,
      'snapshot_id': 'MjYzMDQ0ODAsMDAwMDAwMDA0YmNlYjI5ODJjMjQ2ZDdhNDNjMmY5MTk4M2ZmNDhjYw==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/37i9dQZEVXcE93aFOsdi7J/tracks',
        'total': 30,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:37i9dQZEVXcE93aFOsdi7J',
    }, {
      'collaborative': false,
      'description': 'The songs you just know and can sing aloud even when you&#x27;re blind drunk without any music',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/1XueDduvvEIfEir2GJc8cG',
      },
      'href': 'https://api.spotify.com/v1/playlists/1XueDduvvEIfEir2GJc8cG',
      'id': '1XueDduvvEIfEir2GJc8cG',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/1ceb8b5a3db90cca4eec22ffe44a4a555698c1659dd527eef9cb6777a18f269619f5d982acd38cfaab67616d0000b2732dcab535e36e69ef25239ddaab67616d0000b273f2084e0d4647cef727061f38',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/1ceb8b5a3db90cca4eec22ffe44a4a555698c1659dd527eef9cb6777a18f269619f5d982acd38cfaab67616d0000b2732dcab535e36e69ef25239ddaab67616d0000b273f2084e0d4647cef727061f38',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/1ceb8b5a3db90cca4eec22ffe44a4a555698c1659dd527eef9cb6777a18f269619f5d982acd38cfaab67616d0000b2732dcab535e36e69ef25239ddaab67616d0000b273f2084e0d4647cef727061f38',
        'width': 60,
      }],
      'name': 'Drunk Songs',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': true,
      'snapshot_id': 'NDYsZGU1Y2MwNjYzM2U0ZTViNTAxZjFkNTVjNDUxOGMxOTU5YmU5MWNlMQ==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/1XueDduvvEIfEir2GJc8cG/tracks',
        'total': 30,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:1XueDduvvEIfEir2GJc8cG',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/099bxvxES7QkJtj4hrejhT',
      },
      'href': 'https://api.spotify.com/v1/playlists/099bxvxES7QkJtj4hrejhT',
      'id': '099bxvxES7QkJtj4hrejhT',
      'images': [{
        'height': 640,
        'url': 'https://i.scdn.co/image/ab67616d0000b273bafd4f895553cf639e2c8950',
        'width': 640,
      }],
      'name': 'Test',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': true,
      'snapshot_id': 'MTgsMjNmNjUzMzRkYzk3ODNhOWFjMTY0NTNhMTJmZmI1ZmFiMGIzYWE2Nw==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/099bxvxES7QkJtj4hrejhT/tracks',
        'total': 3,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:099bxvxES7QkJtj4hrejhT',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/2B4H5QMz7Jz07LWNzbWtqp',
      },
      'href': 'https://api.spotify.com/v1/playlists/2B4H5QMz7Jz07LWNzbWtqp',
      'id': '2B4H5QMz7Jz07LWNzbWtqp',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/a7dd46b702f9db5f7eee58a0e32cda04a86ad111ab67616d0000b2733f25e699960f15872a91283bab67616d0000b273c395e1212e00e8af39fa183cab67616d0000b273d9cd8917de31257e2ac920a9',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/a7dd46b702f9db5f7eee58a0e32cda04a86ad111ab67616d0000b2733f25e699960f15872a91283bab67616d0000b273c395e1212e00e8af39fa183cab67616d0000b273d9cd8917de31257e2ac920a9',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/a7dd46b702f9db5f7eee58a0e32cda04a86ad111ab67616d0000b2733f25e699960f15872a91283bab67616d0000b273c395e1212e00e8af39fa183cab67616d0000b273d9cd8917de31257e2ac920a9',
        'width': 60,
      }],
      'name': 'Musicals',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MjQsMWU3ODViM2MzYmNlNTEzMmI4MjJkMzk4YjcxMTVmMmU5NzQ3ZjU1Yg==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/2B4H5QMz7Jz07LWNzbWtqp/tracks',
        'total': 37,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:2B4H5QMz7Jz07LWNzbWtqp',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/6DfnDtWIfXNBPLOLrTnRHt',
      },
      'href': 'https://api.spotify.com/v1/playlists/6DfnDtWIfXNBPLOLrTnRHt',
      'id': '6DfnDtWIfXNBPLOLrTnRHt',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/ab67616d0000b27326202b27ba4beb24c3b95adaab67616d0000b2732d641c0ab1135a9812922da2ab67616d0000b273ac888ead5db3ef37f7521dc1ab67616d0000b273e50d608214d3e38988fd9bf4',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/ab67616d0000b27326202b27ba4beb24c3b95adaab67616d0000b2732d641c0ab1135a9812922da2ab67616d0000b273ac888ead5db3ef37f7521dc1ab67616d0000b273e50d608214d3e38988fd9bf4',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/ab67616d0000b27326202b27ba4beb24c3b95adaab67616d0000b2732d641c0ab1135a9812922da2ab67616d0000b273ac888ead5db3ef37f7521dc1ab67616d0000b273e50d608214d3e38988fd9bf4',
        'width': 60,
      }],
      'name': 'Liked from Radio',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MjEsN2RkMDU4YzQwZWU1ZTcxYTQwOTJhOTYyYmMyZDFlYmNlNmFiMDZkNQ==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/6DfnDtWIfXNBPLOLrTnRHt/tracks',
        'total': 19,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:6DfnDtWIfXNBPLOLrTnRHt',
    }, {
      'collaborative': false,
      'description': '',
      'external_urls': {
        'spotify': 'https://open.spotify.com/playlist/1b1WGErHarH1cd3mH50IHO',
      },
      'href': 'https://api.spotify.com/v1/playlists/1b1WGErHarH1cd3mH50IHO',
      'id': '1b1WGErHarH1cd3mH50IHO',
      'images': [{
        'height': 640,
        'url': 'https://mosaic.scdn.co/640/ab67616d0000b27375b187a017d9b264d73faa74ab67616d0000b27375fc99dfb991676c6e967fc9ab67616d0000b273dc8371394dcdfcf4fc7a288dab67616d0000b273f7ec724fbf97a30869d06240',
        'width': 640,
      }, {
        'height': 300,
        'url': 'https://mosaic.scdn.co/300/ab67616d0000b27375b187a017d9b264d73faa74ab67616d0000b27375fc99dfb991676c6e967fc9ab67616d0000b273dc8371394dcdfcf4fc7a288dab67616d0000b273f7ec724fbf97a30869d06240',
        'width': 300,
      }, {
        'height': 60,
        'url': 'https://mosaic.scdn.co/60/ab67616d0000b27375b187a017d9b264d73faa74ab67616d0000b27375fc99dfb991676c6e967fc9ab67616d0000b273dc8371394dcdfcf4fc7a288dab67616d0000b273f7ec724fbf97a30869d06240',
        'width': 60,
      }],
      'name': 'My Shazam Tracks',
      'owner': {
        'display_name': 'Sam Chung',
        'external_urls': {
          'spotify': 'https://open.spotify.com/user/samchungy',
        },
        'href': 'https://api.spotify.com/v1/users/samchungy',
        'id': 'samchungy',
        'type': 'user',
        'uri': 'spotify:user:samchungy',
      },
      'primary_color': null,
      'public': false,
      'snapshot_id': 'MjQsNTkzODdjNWE3ZTZjNjM1NmNmZjY3OGQ4ZmEwM2QwMDBlMzVjYWIwZQ==',
      'tracks': {
        'href': 'https://api.spotify.com/v1/playlists/1b1WGErHarH1cd3mH50IHO/tracks',
        'total': 39,
      },
      'type': 'playlist',
      'uri': 'spotify:playlist:1b1WGErHarH1cd3mH50IHO',
    }],
    'limit': 50,
    'next': null,
    'offset': 0,
    'previous': null,
    'total': 28,
  },
  ));
  loadPlaylistSetting.mockReturnValueOnce(Promise.resolve({
    name: 'Spotbot',
    url: 'https://open.spotify.com/playlist/6TefVIS1ryrtEmjerqFu1N',
    id: '6TefVIS1ryrtEmjerqFu1N',
  }));
  storePlaylists.mockReturnValueOnce(Promise.resolve());
  test('should post a playlists response', async () => {
    const response = await request(server)
        .post('/slack/actions/options')
        .send({payload: `{"type":"block_suggestion","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"container":{"type":"view","view_id":"VSH0A4WN9"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","action_id":"playlist","block_id":"playlist","value":"Tes","view":{"id":"VSH0A4WN9","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRVUTDP47"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"placeholder":{"type":"plain_text","text":"Enter a playlist name","emoji":true},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"},"placeholder":{"type":"plain_text","text":"Pick an option","emoji":true},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"4","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"timezone","label":{"type":"plain_text","text":"Timezone","emoji":true},"hint":{"type":"plain_text","text":"This is to configure the time based skip votes.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"timezone","initial_option":{"text":{"type":"plain_text","text":"Australia/Melbourne","emoji":true},"value":"Australia/Melbourne"},"placeholder":{"type":"plain_text","text":"Find your timezone","emoji":true},"min_query_length":3}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"2","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"0","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRVUTDP47"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"4"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"timezone":{"timezone":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Australia/Melbourne","emoji":true},"value":"Australia/Melbourne"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"2"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"0"}}}},"hash":"1578646703.7e371c12","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VSH0A4WN9","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}`});
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(fetchPlaylists).toBeCalled();
    expect(loadPlaylistSetting).toBeCalled();
    expect(storePlaylists).toBeCalled();
    expect(response.text).toEqual(`{\"option_groups\":[{\"label\":{\"type\":\"plain_text\",\"text\":\"Search Results:\"},\"options\":[{\"text\":{\"type\":\"plain_text\",\"text\":\"Test\",\"emoji\":true},\"value\":\"2nuwjAGCHQiPabqGH6SLty\"},{\"text\":{\"type\":\"plain_text\",\"text\":\"Test\",\"emoji\":true},\"value\":\"099bxvxES7QkJtj4hrejhT\"}]},{\"label\":{\"type\":\"plain_text\",\"text\":\"Other:\"},\"options\":[{\"text\":{\"type\":\"plain_text\",\"text\":\"Spotbot (Current Selection)\",\"emoji\":true},\"value\":\"6TefVIS1ryrtEmjerqFu1N\"},{\"text\":{\"type\":\"plain_text\",\"text\":\"Create a new playlist called \\\"Tes\\\"\",\"emoji\":true},\"value\":\"create_new_playlist.Tes\"}]}]}`);
  });
});

describe('Get default device options', () => {
  fetchDevices.mockReturnValueOnce(Promise.resolve({
    devices: [
      {
        id: '87997bb4312981a00f1d8029eb874c55a211a0cc',
        is_active: false,
        is_private_session: false,
        is_restricted: false,
        name: 'AU13282',
        type: 'Computer',
        volume_percent: 0,
      },
    ],
  }));
  loadDefaultDevice.mockReturnValueOnce(Promise.resolve({
    name: 'AU13282 - Computer',
    id: '87997bb4312981a00f1d8029eb874c55a211a0cc',
  }));
  storeDevices.mockReturnValueOnce(Promise.resolve());
  test('should post a devices response', async () => {
    const response = await request(server)
        .post('/slack/actions/options')
        .send({payload: `{"type":"block_suggestion","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"container":{"type":"view","view_id":"VS5GZF1C3"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","action_id":"default_device","block_id":"default_device","value":"","view":{"id":"VS5GZF1C3","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRVUTDP47"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"placeholder":{"type":"plain_text","text":"Enter a playlist name","emoji":true},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"},"placeholder":{"type":"plain_text","text":"Pick an option","emoji":true},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"4","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"timezone","label":{"type":"plain_text","text":"Timezone","emoji":true},"hint":{"type":"plain_text","text":"This is to configure the time based skip votes.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"timezone","initial_option":{"text":{"type":"plain_text","text":"Australia/Melbourne","emoji":true},"value":"Australia/Melbourne"},"placeholder":{"type":"plain_text","text":"Find your timezone","emoji":true},"min_query_length":3}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"2","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"0","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRVUTDP47"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"4"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"timezone":{"timezone":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Australia/Melbourne","emoji":true},"value":"Australia/Melbourne"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"2"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"0"}}}},"hash":"1578649039.d3136931","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VS5GZF1C3","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}`});
    expect(response.status).toEqual(200);
    expect(loadDefaultDevice).toBeCalled();
    expect(fetchDevices).toBeCalled();
    expect(storeDevices).toBeCalled();
    expect(response.text).toEqual('{"options":[{"text":{"type":"plain_text","text":"None","emoji":true},"value":"no_devices"},{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"}]}');
  });
});

describe('Get timezone options', () => {
  test('should post a timezone response', async () => {
    const response = await request(server)
        .post('/slack/actions/options')
        .send({payload: `{"type":"block_suggestion","team":{"id":"TRVUTD7DM","domain":"spotbottest"},"user":{"id":"URVUTD7UP","username":"samchungy","name":"samchungy","team_id":"TRVUTD7DM"},"container":{"type":"view","view_id":"VS9S9QSN7"},"api_app_id":"ARGK9E735","token":"6r2mZJdBz8Gb8wSl49SHMABa","action_id":"timezone","block_id":"timezone","value":"Austral","view":{"id":"VS9S9QSN7","team_id":"TRVUTD7DM","type":"modal","blocks":[{"type":"section","block_id":"reauth","text":{"type":"mrkdwn","text":"Click to re-authenticate with Spotify.","verbatim":false},"accessory":{"type":"button","action_id":"reauth","text":{"type":"plain_text","text":":gear: Re-authenticate with Spotify","emoji":true},"value":"reauth"}},{"type":"context","block_id":"auth_confirmation","elements":[{"type":"mrkdwn","text":":white_check_mark: Authenticated with Sam Chung - Spotify Premium","verbatim":false}]},{"type":"input","block_id":"slack_channel","label":{"type":"plain_text","text":"Slack Channel Restriction","emoji":true},"hint":{"type":"plain_text","text":"The channel Slackbot will restrict usage of commands to.","emoji":true},"optional":false,"element":{"type":"channels_select","action_id":"slack_channel","initial_channel":"CRTKGH71S"}},{"type":"input","block_id":"playlist","label":{"type":"plain_text","text":"Spotbot Playlist","emoji":true},"hint":{"type":"plain_text","text":"The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"playlist","initial_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"},"placeholder":{"type":"plain_text","text":"Enter a playlist name","emoji":true},"min_query_length":3}},{"type":"input","block_id":"default_device","label":{"type":"plain_text","text":"Default Spotify Device","emoji":true},"hint":{"type":"plain_text","text":"This helps Spotbot with playing. Turn on your Spotify device now.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"default_device","initial_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"},"placeholder":{"type":"plain_text","text":"Pick an option","emoji":true},"min_query_length":0}},{"type":"input","block_id":"disable_repeats_duration","label":{"type":"plain_text","text":"Disable Repeats Duration (Hours)","emoji":true},"hint":{"type":"plain_text","text":"The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"disable_repeats_duration","placeholder":{"type":"plain_text","text":"Enter a number eg. 4","emoji":true},"initial_value":"3","max_length":5}},{"type":"input","block_id":"back_to_playlist","label":{"type":"plain_text","text":"Jump Back to Playlist","emoji":true},"hint":{"type":"plain_text","text":"Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).","emoji":true},"optional":false,"element":{"type":"static_select","action_id":"back_to_playlist","initial_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},"options":[{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"},{"text":{"type":"plain_text","text":"No","emoji":true},"value":"false"}]}},{"type":"input","block_id":"timezone","label":{"type":"plain_text","text":"Timezone","emoji":true},"hint":{"type":"plain_text","text":"This is to configure the time based skip votes. Type in a location.","emoji":true},"optional":false,"element":{"type":"external_select","action_id":"timezone","initial_option":{"text":{"type":"plain_text","text":"Australia\/Melbourne (+11:00)","emoji":true},"value":"Australia\/Melbourne"},"placeholder":{"type":"plain_text","text":"Find your timezone","emoji":true},"min_query_length":3}},{"type":"input","block_id":"skip_votes","label":{"type":"plain_text","text":"Skip Votes","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes","placeholder":{"type":"plain_text","text":"Enter a number eg. 2","emoji":true},"initial_value":"3","max_length":2}},{"type":"input","block_id":"skip_votes_ah","label":{"type":"plain_text","text":"Skip Votes - After Hours (6pm-6am)","emoji":true},"hint":{"type":"plain_text","text":"The number of additional votes needed to skip a song. Integers only","emoji":true},"optional":false,"element":{"type":"plain_text_input","action_id":"skip_votes_ah","placeholder":{"type":"plain_text","text":"Enter a number eg. 0","emoji":true},"initial_value":"3","max_length":2}}],"private_metadata":"","callback_id":"settings_modal","state":{"values":{"slack_channel":{"slack_channel":{"type":"channels_select","selected_channel":"CRTKGH71S"}},"playlist":{"playlist":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Spotbot","emoji":true},"value":"6TefVIS1ryrtEmjerqFu1N"}}},"default_device":{"default_device":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"AU13282 - Computer","emoji":true},"value":"87997bb4312981a00f1d8029eb874c55a211a0cc"}}},"disable_repeats_duration":{"disable_repeats_duration":{"type":"plain_text_input","value":"3"}},"back_to_playlist":{"back_to_playlist":{"type":"static_select","selected_option":{"text":{"type":"plain_text","text":"Yes","emoji":true},"value":"true"}}},"timezone":{"timezone":{"type":"external_select","selected_option":{"text":{"type":"plain_text","text":"Australia\/Melbourne (+11:00)","emoji":true},"value":"Australia\/Melbourne"}}},"skip_votes":{"skip_votes":{"type":"plain_text_input","value":"3"}},"skip_votes_ah":{"skip_votes_ah":{"type":"plain_text_input","value":"3"}}}},"hash":"1578995169.8d421068","title":{"type":"plain_text","text":"Spotbot Settings","emoji":true},"clear_on_close":false,"notify_on_close":false,"close":{"type":"plain_text","text":"Cancel","emoji":true},"submit":{"type":"plain_text","text":"Save","emoji":true},"previous_view_id":null,"root_view_id":"VS9S9QSN7","app_id":"ARGK9E735","external_id":"","app_installed_team_id":"TRVUTD7DM","bot_id":"BRGKAFS67"}}`});
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('{"option_groups":[{"label":{"type":"plain_text","text":"23 queries for \\"Austral\\"."},"options":[{"text":{"type":"plain_text","text":"Australia/ACT (+11:00)","emoji":true},"value":"Australia/ACT"},{"text":{"type":"plain_text","text":"Australia/Adelaide (+10:30)","emoji":true},"value":"Australia/Adelaide"},{"text":{"type":"plain_text","text":"Australia/Brisbane (+10:00)","emoji":true},"value":"Australia/Brisbane"},{"text":{"type":"plain_text","text":"Australia/Broken_Hill (+10:30)","emoji":true},"value":"Australia/Broken_Hill"},{"text":{"type":"plain_text","text":"Australia/Canberra (+11:00)","emoji":true},"value":"Australia/Canberra"},{"text":{"type":"plain_text","text":"Australia/Currie (+11:00)","emoji":true},"value":"Australia/Currie"},{"text":{"type":"plain_text","text":"Australia/Darwin (+09:30)","emoji":true},"value":"Australia/Darwin"},{"text":{"type":"plain_text","text":"Australia/Eucla (+08:45)","emoji":true},"value":"Australia/Eucla"},{"text":{"type":"plain_text","text":"Australia/Hobart (+11:00)","emoji":true},"value":"Australia/Hobart"},{"text":{"type":"plain_text","text":"Australia/LHI (+11:00)","emoji":true},"value":"Australia/LHI"},{"text":{"type":"plain_text","text":"Australia/Lindeman (+10:00)","emoji":true},"value":"Australia/Lindeman"},{"text":{"type":"plain_text","text":"Australia/Lord_Howe (+11:00)","emoji":true},"value":"Australia/Lord_Howe"},{"text":{"type":"plain_text","text":"Australia/Melbourne (+11:00)","emoji":true},"value":"Australia/Melbourne"},{"text":{"type":"plain_text","text":"Australia/NSW (+11:00)","emoji":true},"value":"Australia/NSW"},{"text":{"type":"plain_text","text":"Australia/North (+09:30)","emoji":true},"value":"Australia/North"},{"text":{"type":"plain_text","text":"Australia/Perth (+08:00)","emoji":true},"value":"Australia/Perth"},{"text":{"type":"plain_text","text":"Australia/Queensland (+10:00)","emoji":true},"value":"Australia/Queensland"},{"text":{"type":"plain_text","text":"Australia/South (+10:30)","emoji":true},"value":"Australia/South"},{"text":{"type":"plain_text","text":"Australia/Sydney (+11:00)","emoji":true},"value":"Australia/Sydney"},{"text":{"type":"plain_text","text":"Australia/Tasmania (+11:00)","emoji":true},"value":"Australia/Tasmania"},{"text":{"type":"plain_text","text":"Australia/Victoria (+11:00)","emoji":true},"value":"Australia/Victoria"},{"text":{"type":"plain_text","text":"Australia/West (+08:00)","emoji":true},"value":"Australia/West"},{"text":{"type":"plain_text","text":"Australia/Yancowinna (+10:30)","emoji":true},"value":"Australia/Yancowinna"}]}]}');
  });
});
