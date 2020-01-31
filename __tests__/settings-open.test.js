const server = require('../server/server').mockapp;
const request = require('supertest');

const {fetchAuthorizeURL} = require('../server/components/spotify-api/spotify-api-auth');
const {fetchProfile} = require('../server/components/spotify-api/spotify-api-profile');
const {storeState} = require('../server/components/settings/spotifyauth/spotifyauth-dal');
const {sendModal} = require('../server/components/slack/slack-api');
const {AuthError} = require('../server/errors/errors-auth');
const {loadPlaylistSetting, loadSettings} = require('../server/components/settings/settings-dal');

jest.mock('../server/components/spotify-api/spotify-api-auth');
jest.mock('../server/components/spotify-api/spotify-api-profile');
jest.mock('../server/components/settings/spotifyauth/spotifyauth-dal');
jest.mock('../server/components/slack/slack-api.js');
jest.mock('../server/components/settings/settings-dal');


beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

const settingsSlashPayload = {
  token: '6r2mZJdBz8Gb8wSl49SHMABa',
  team_id: 'TRVUTD7DM',
  team_domain: 'spotbottest',
  channel_id: 'CRVUTDP47',
  channel_name: 'slack-bots',
  user_id: 'URVUTD7UP',
  user_name: 'samchungy',
  command: '/spotbot',
  text: 'settings',
  response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/920606799857/zpbRZv0e10qbT5lqdmdwPEXK',
  trigger_id: '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3',
};

const spotifyProfile = {
  country: 'AU',
  display_name: 'Sam Chung',
  email: 'samchungy@hotmail.com',
  explicit_content: {filter_enabled: false, filter_locked: false},
  external_urls: {spotify: 'https://open.spotify.com/user/samchungy'},
  followers: {href: null, total: 20},
  href: 'https://api.spotify.com/v1/users/samchungy',
  id: 'samchungy',
  images: [
    {
      height: null,
      url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/c53.0.320.320a/p320x320/40685720_10210198758440101_5414308512903725056_o.jpg?_nc_cat=102&_nc_ohc=GWYjl1uLkDMAX_V91OO&_nc_ht=scontent.xx&oh=34d06bfb9fece70b05cfeb8116921047&oe=5ECC19E2',
      width: null,
    },
  ],
  product: 'premium',
  type: 'user',
  uri: 'spotify:user:samchungy',
};

const emptySettings = {
  channel_admin: null,
  playlist: null,
  default_device: null,
  disable_repeats_duration: null,
  back_to_playlist: null,
  skip_votes: null,
  skip_votes_ah: null,
  timezone: null,
};

const fullSettings = {
  channel_admin: ['URVUTD7UP'],
  playlist: {
    name: 'Test',
    id: '2nuwjAGCHQiPabqGH6SLty',
    uri: 'spotify:playlist:2nuwjAGCHQiPabqGH6SLty',
    url: 'https://open.spotify.com/playlist/2nuwjAGCHQiPabqGH6SLty',
  },
  default_device: {name: 'None', id: 'no_devices'},
  disable_repeats_duration: '3',
  back_to_playlist: 'true',
  skip_votes: '2',
  skip_votes_ah: '0',
  timezone: 'Australia/Melbourne',
};

fetchAuthorizeURL.mockReturnValue(Promise.resolve(`https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/settings/auth/callback&scope=user-read-private%20user-read-email%20user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=%7B%22teamId%22:%22TRVUTD7DM%22,%22channelId%22:%22CRVUTDP47%22,%22triggerId%22:%22918078500818.879979449463.14065b71c248debb1b1d2c47e1a1fadc%22%7D&show_dialog=true`));
storeState.mockReturnValue(Promise.resolve());

describe('Slash Command: /spotbot settings - new instance', () => {
  loadPlaylistSetting.mockReturnValueOnce(Promise.resolve(null));
  fetchProfile.mockImplementationOnce(() => Promise.reject(new AuthError('Auth Error')));
  test('should open a fresh modal settings panel in Slack with auth prompt', async () => {
    const response = await request(server)
        .post('/settings')
        .send(settingsSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchAuthorizeURL).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(storeState).toBeCalled();
    expect(sendModal).toBeCalledWith('920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3', {'blocks': [{'accessory': {'action_id': 'auth_url', 'text': {'emoji': true, 'text': ':link: Authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'url': 'https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/settings/auth/callback&scope=user-read-private%20user-read-email%20user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=%7B%22teamId%22:%22TRVUTD7DM%22,%22channelId%22:%22CRVUTDP47%22,%22triggerId%22:%22918078500818.879979449463.14065b71c248debb1b1d2c47e1a1fadc%22%7D&show_dialog=true'}, 'block_id': 'auth_url', 'text': {'text': 'Click to authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'private_metadata': 'CRVUTDP47', 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe('Slash Command: /spotbot settings - already authed', () => {
  loadPlaylistSetting.mockReturnValueOnce(Promise.resolve(null));
  fetchProfile.mockImplementationOnce(() => Promise.resolve(spotifyProfile));
  loadSettings.mockReturnValueOnce(Promise.resolve(emptySettings));
  test('should open a blank modal settings panel in Slack', async () => {
    const response = await request(server)
        .post('/settings')
        .send(settingsSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchAuthorizeURL).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(storeState).toBeCalled();
    expect(sendModal).toBeCalledWith('920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3', {'blocks': [{'accessory': {'action_id': 'reauth', 'confirm': {'confirm': {'text': 'Reset Authentication', 'type': 'plain_text'}, 'deny': {'text': 'Cancel', 'type': 'plain_text'}, 'text': {'text': 'This will disable this channel\'s Spotbot functionality until Spotbot is reauthenticated.', 'type': 'mrkdwn'}, 'title': {'text': 'Are you sure?', 'type': 'plain_text'}}, 'text': {'emoji': true, 'text': ':gear: Re-authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'value': 'reauth'}, 'block_id': 'reauth', 'text': {'text': 'Click to re-authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'auth_confirmation', 'elements': [{'text': ':white_check_mark: Authenticated with Sam Chung - Spotify Premium', 'type': 'mrkdwn'}], 'type': 'context'}, {'block_id': 'channel_admin', 'element': {'action_id': 'channel_admin', 'type': 'multi_users_select'}, 'hint': {'text': 'Admins can use Spotbot admin commands within this channel and modify it\'s settings.', 'type': 'plain_text'}, 'label': {'text': 'Channel Admins', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'playlist', 'element': {'action_id': 'playlist', 'min_query_length': 3, 'placeholder': {'text': 'Type a playlist name', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.', 'type': 'plain_text'}, 'label': {'text': 'Spotbot Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'default_device', 'element': {'action_id': 'default_device', 'min_query_length': 0, 'placeholder': {'text': 'Pick an option', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'This helps Spotbot with playing. Turn on your Spotify device now.', 'type': 'plain_text'}, 'label': {'text': 'Default Spotify Device', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'disable_repeats_duration', 'element': {'action_id': 'disable_repeats_duration', 'max_length': 5, 'placeholder': {'text': 'Enter a number eg. 4', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.', 'type': 'plain_text'}, 'label': {'text': 'Disable Repeats Duration (Hours)', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'back_to_playlist', 'element': {'action_id': 'back_to_playlist', 'options': [{'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, {'text': {'emoji': true, 'text': 'No', 'type': 'plain_text'}, 'value': 'false'}], 'type': 'static_select'}, 'hint': {'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).', 'type': 'plain_text'}, 'label': {'text': 'Jump Back to Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'timezone', 'element': {'action_id': 'timezone', 'min_query_length': 3, 'placeholder': {'text': 'Type to find your timezone', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'This is to configure the time based skip votes. Type in a location.', 'type': 'plain_text'}, 'label': {'text': 'Timezone', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes', 'element': {'action_id': 'skip_votes', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 2', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes_ah', 'element': {'action_id': 'skip_votes_ah', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 0', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes - After Hours (6pm-6am)', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'private_metadata': 'CRVUTDP47', 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

describe('Slash Command: /spotbot settings - already authed, already set', () => {
  loadPlaylistSetting.mockReturnValueOnce(Promise.resolve(null));
  fetchProfile.mockImplementationOnce(() => Promise.resolve(spotifyProfile));
  loadSettings.mockReturnValueOnce(Promise.resolve(fullSettings));
  test('should open a full modal settings panel in Slack', async () => {
    const response = await request(server)
        .post('/settings')
        .send(settingsSlashPayload);
    expect(response.status).toEqual(200);
    expect(fetchAuthorizeURL).toBeCalled();
    expect(fetchProfile).toBeCalled();
    expect(storeState).toBeCalled();
    expect(sendModal).toBeCalledWith('920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3', {'blocks': [{'accessory': {'action_id': 'reauth', 'confirm': {'confirm': {'text': 'Reset Authentication', 'type': 'plain_text'}, 'deny': {'text': 'Cancel', 'type': 'plain_text'}, 'text': {'text': 'This will disable this channel\'s Spotbot functionality until Spotbot is reauthenticated.', 'type': 'mrkdwn'}, 'title': {'text': 'Are you sure?', 'type': 'plain_text'}}, 'text': {'emoji': true, 'text': ':gear: Re-authenticate with Spotify', 'type': 'plain_text'}, 'type': 'button', 'value': 'reauth'}, 'block_id': 'reauth', 'text': {'text': 'Click to re-authenticate with Spotify.', 'type': 'mrkdwn'}, 'type': 'section'}, {'block_id': 'auth_confirmation', 'elements': [{'text': ':white_check_mark: Authenticated with Sam Chung - Spotify Premium', 'type': 'mrkdwn'}], 'type': 'context'}, {'block_id': 'channel_admin', 'element': {'action_id': 'channel_admin', 'initial_users': ['URVUTD7UP'], 'type': 'multi_users_select'}, 'hint': {'text': 'Admins can use Spotbot admin commands within this channel and modify it\'s settings.', 'type': 'plain_text'}, 'label': {'text': 'Channel Admins', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'playlist', 'element': {'action_id': 'playlist', 'initial_option': {'text': {'emoji': true, 'text': 'Test', 'type': 'plain_text'}, 'value': '2nuwjAGCHQiPabqGH6SLty'}, 'min_query_length': 3, 'placeholder': {'text': 'Type a playlist name', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'The name of the playlist Spotbot will add to. You can use an existing playlist or create a new collaborative playlist.', 'type': 'plain_text'}, 'label': {'text': 'Spotbot Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'default_device', 'element': {'action_id': 'default_device', 'initial_option': {'text': {'emoji': true, 'text': 'None', 'type': 'plain_text'}, 'value': 'no_devices'}, 'min_query_length': 0, 'placeholder': {'text': 'Pick an option', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'This helps Spotbot with playing. Turn on your Spotify device now.', 'type': 'plain_text'}, 'label': {'text': 'Default Spotify Device', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'disable_repeats_duration', 'element': {'action_id': 'disable_repeats_duration', 'initial_value': '3', 'max_length': 5, 'placeholder': {'text': 'Enter a number eg. 4', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The duration where no one can add the same song. Set it to 0 to allow repeats all the time. Integers only.', 'type': 'plain_text'}, 'label': {'text': 'Disable Repeats Duration (Hours)', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'back_to_playlist', 'element': {'action_id': 'back_to_playlist', 'initial_option': {'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, 'options': [{'text': {'emoji': true, 'text': 'Yes', 'type': 'plain_text'}, 'value': 'true'}, {'text': {'emoji': true, 'text': 'No', 'type': 'plain_text'}, 'value': 'false'}], 'type': 'static_select'}, 'hint': {'text': 'Enables Spotify to return to the playlist when a new song is added if the playlist has runs out of songs. (Does not work if repeat is enabled).', 'type': 'plain_text'}, 'label': {'text': 'Jump Back to Playlist', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'timezone', 'element': {'action_id': 'timezone', 'initial_option': {'text': {'emoji': true, 'text': 'Australia/Melbourne (+11:00)', 'type': 'plain_text'}, 'value': 'Australia/Melbourne'}, 'min_query_length': 3, 'placeholder': {'text': 'Type to find your timezone', 'type': 'plain_text'}, 'type': 'external_select'}, 'hint': {'text': 'This is to configure the time based skip votes. Type in a location.', 'type': 'plain_text'}, 'label': {'text': 'Timezone', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes', 'element': {'action_id': 'skip_votes', 'initial_value': '2', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 2', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes', 'type': 'plain_text'}, 'type': 'input'}, {'block_id': 'skip_votes_ah', 'element': {'action_id': 'skip_votes_ah', 'initial_value': '0', 'max_length': 2, 'placeholder': {'text': 'Enter a number eg. 0', 'type': 'plain_text'}, 'type': 'plain_text_input'}, 'hint': {'text': 'The number of additional votes needed to skip a song. Integers only', 'type': 'plain_text'}, 'label': {'text': 'Skip Votes - After Hours (6pm-6am)', 'type': 'plain_text'}, 'type': 'input'}], 'callback_id': 'settings_modal', 'close': {'emoji': true, 'text': 'Cancel', 'type': 'plain_text'}, 'private_metadata': 'CRVUTDP47', 'submit': {'emoji': true, 'text': 'Save', 'type': 'plain_text'}, 'title': {'emoji': true, 'text': 'Spotbot Settings', 'type': 'plain_text'}, 'type': 'modal'});
  });
});

