const port = 4016;
const server = require('../../server/server')({port});
const request = require('supertest');

const {loadPlaylist, loadProfile} = require('../../server/components/settings/settings-interface');
const {loadSearch, storeSearch} = require('../../server/components/tracks/tracks-dal');
const {fetchArtists} = require('../../server/components/spotify-api/spotify-api-search');
const {postEphemeral, reply} = require('../../server/components/slack/slack-api');
const {ARTISTS_RESPONSES} = require('../../server/components/tracks/tracks-artists-find');

jest.mock('../../server/components/settings/settings-interface');
jest.mock('../../server/components/spotify-api/spotify-api-search');
jest.mock('../../server/components/spotify-api/spotify-api-devices');
jest.mock('../../server/components/spotify-api/spotify-api-playback-status');
jest.mock('../../server/components/slack/slack-api');
jest.mock('../../server/components/control/control-panel');
jest.mock('../../server/util/util-timeout');
jest.mock('../../server/components/tracks/tracks-dal');
jest.mock('../../server/components/slack/slack-middleware', () => jest.fn(async (ctx, next) => await next()));

const {artistSlashPayload} = require('../mocks/payloads/slash-commands');
const {mockSearchArtists} = require('../mocks/spotify-api/search');
const {seeMoreArtistsPayload} = require('../mocks/payloads/slack-actions');
const {fullArtistSearch} = require('../mocks/db/search');
const {fullPlaylistSetting, fullProfile} = require('../mocks/db/settings');

beforeEach(() => {
  jest.clearAllMocks();
});

// close the server after each test
afterEach(() => {
  server.close();
});

loadPlaylist.mockReturnValue(Promise.resolve(fullPlaylistSetting));

describe('Slash Command: /artist - empty text', () => {
  const artistSlashEmptyPayload = {...artistSlashPayload};
  artistSlashEmptyPayload.text = '';

  test('should return empty query', async () => {
    const response = await request(server)
        .post('/tracks/artist/')
        .send(artistSlashEmptyPayload);
    expect(response.status).toEqual(200);
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': artistSlashEmptyPayload.channel_id, 'text': ARTISTS_RESPONSES.query_empty, 'user': artistSlashEmptyPayload.user_id});
  });
});

describe('Slash Command: /artist - invalid query', () => {
  const artistSlashInvalidPayload = {...artistSlashPayload};
  artistSlashInvalidPayload.text = '***';

  test('should return invalid query', async () => {
    const response = await request(server)
        .post('/tracks/artist/')
        .send(artistSlashInvalidPayload);
    expect(response.status).toEqual(200);
    expect(postEphemeral).toBeCalledWith({'blocks': null, 'channel': artistSlashInvalidPayload.channel_id, 'text': ARTISTS_RESPONSES.query_error, 'user': artistSlashInvalidPayload.user_id});
  });
});

describe('Slash Command: /artist - query lime', () => {
  const artistSlashLimePayload = {...artistSlashPayload};
  artistSlashLimePayload.text = 'lime';
  loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
  loadSearch.mockReturnValueOnce(Promise.resolve(fullArtistSearch));
  fetchArtists.mockReturnValueOnce(Promise.resolve(mockSearchArtists));

  test('should return an artist payload', async () => {
    const response = await request(server)
        .post('/tracks/artist/')
        .send(artistSlashLimePayload);
    expect(response.status).toEqual(200);
    expect(loadProfile).toBeCalled();
    expect(fetchArtists).toBeCalled();
    expect(storeSearch).toBeCalledTimes(2);
    expect(loadSearch).toBeCalled();
    expect(postEphemeral).toBeCalledWith({'channel': 'CRVUTDP47', 'text': ':mag: Are these the artists you were looking for?', 'blocks': [{'type': 'section', 'text': {'type': 'mrkdwn', 'text': ':mag: Are these the artists you were looking for?'}}, {'type': 'section', 'text': {'type': 'mrkdwn', 'text': '<https://open.spotify.com/artist/6yrtCy4XJHXM6tczo4RlTs|*Lime Cordiale*>\n\n:notes: *Genres:* Australian Hip Hop, Australian Indie, Australian Pop\n\n:busts_in_silhouette: *Followers*: 89,661\n'}, 'accessory': {'type': 'image', 'image_url': 'https://i.scdn.co/image/f98d0145acad49a54d218cb5f578b9594f5f4d10', 'alt_text': 'Artist Art'}}, {'type': 'actions', 'elements': [{'value': '6yrtCy4XJHXM6tczo4RlTs', 'action_id': 'view_artist_tracks', 'type': 'button', 'text': {'type': 'plain_text', 'emoji': true, 'text': 'View Artist Tracks'}, 'style': 'primary'}]}, {'type': 'section', 'text': {'type': 'mrkdwn', 'text': '<https://open.spotify.com/artist/5o4dgimn1R07w1d2ZzpzpP|*Limes*>\n\n:notes: *Genres:* Chillhop, Lo-fi Beats\n\n:busts_in_silhouette: *Followers*: 25,118\n'}, 'accessory': {'type': 'image', 'image_url': 'https://i.scdn.co/image/b19f72d57dd6c7051699e11a7ad3fed1949d2a74', 'alt_text': 'Artist Art'}}, {'type': 'actions', 'elements': [{'value': '5o4dgimn1R07w1d2ZzpzpP', 'action_id': 'view_artist_tracks', 'type': 'button', 'text': {'type': 'plain_text', 'emoji': true, 'text': 'View Artist Tracks'}, 'style': 'primary'}]}, {'type': 'section', 'text': {'type': 'mrkdwn', 'text': '<https://open.spotify.com/artist/4VhlhOe3FHkPzW4BsYR9EC|*Limestone Quarry*>\n\n:notes: *Genres:* Background Music, Calming Instrumental\n\n:busts_in_silhouette: *Followers*: 165\n'}, 'accessory': {'type': 'image', 'image_url': 'https://i.scdn.co/image/ab67616d00001e029f13ff3bbefd311fe0e78c6a', 'alt_text': 'Artist Art'}}, {'type': 'actions', 'elements': [{'value': '4VhlhOe3FHkPzW4BsYR9EC', 'action_id': 'view_artist_tracks', 'type': 'button', 'text': {'type': 'plain_text', 'emoji': true, 'text': 'View Artist Tracks'}, 'style': 'primary'}]}, {'type': 'context', 'elements': [{'type': 'mrkdwn', 'text': 'Page 1/10'}]}, {'type': 'actions', 'elements': [{'value': '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3', 'action_id': 'see_more_artists', 'type': 'button', 'text': {'type': 'plain_text', 'emoji': true, 'text': 'Next 3 Artists'}}, {'value': '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3', 'action_id': 'cancel_search', 'type': 'button', 'text': {'type': 'plain_text', 'emoji': true, 'text': 'Cancel Search'}, 'style': 'danger'}]}], 'user': 'URVUTD7UP'});
  });
});

describe('Get 3 more artists', () => {
  loadProfile.mockReturnValueOnce(Promise.resolve(fullProfile));
  loadSearch.mockReturnValueOnce(Promise.resolve(fullArtistSearch));

  test('should return a artist payload', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: seeMoreArtistsPayload});
    expect(response.status).toEqual(200);
    expect(storeSearch).toBeCalled();
    expect(loadSearch).toBeCalled();
    expect(reply).toBeCalledWith({'blocks': expect.anything(), 'replace_original': 'true', 'text': ARTISTS_RESPONSES.found}, expect.anything());
  });
});

describe('Get 3 more artists old', () => {
  loadSearch.mockReturnValueOnce(Promise.resolve(null));
  test('should return expired', async () => {
    const response = await request(server)
        .post('/slack/actions')
        .send({payload: seeMoreArtistsPayload});
    expect(response.status).toEqual(200);
    expect(loadSearch).toBeCalled();
    expect(reply).toBeCalledWith({'replace_original': 'true', 'text': ARTISTS_RESPONSES.expired}, expect.anything());
  });
});
