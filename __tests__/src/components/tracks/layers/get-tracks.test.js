const mockConfig = {
  'slack': {
    'limits': {
      'max_options': 3,
    },
    'actions': {
      'blacklist_modal': 'blacklist_modal',
      'sonos_modal': 'sonos_modal',
      'settings_modal': 'settings_modal',
      'device_modal': 'device_modal',
      'empty_modal': 'empty_modal',
      'remove_modal': 'remove_modal',
      'reset_modal': 'reset_modal',
      'playlist': 'playlist',
      'block_actions': 'block_actions',
      'view_submission': 'view_submission',
      'view_closed': 'view_closed',
      'controller': 'controller',
      'controller_overflow': 'controller_overflow',
      'reset_review_confirm': 'reset_review_confirm',
      'reset_review_deny': 'reset_review_deny',
      'reset_review_jump': 'reset_review_jump',
      'controls': {
        'play': 'play',
        'play_close': 'play_close',
        'play_track': 'play_track',
        'pause': 'pause',
        'skip': 'skip',
        'reset': 'reset',
        'clear_one': 'clear_one',
        'jump_to_start': 'jump_to_start',
        'jump_to_start_close': 'jump_to_start_close',
        'shuffle': 'shuffle',
        'repeat': 'repeat',
      },
      'skip_vote': 'skip_vote',
      'tracks': {
        'add_to_playlist': 'add_to_playlist',
        'see_more_results': 'see_more_results',
        'cancel_search': 'cancel_search',
      },
      'artists': {
        'view_artist_tracks': 'view_artist_tracks',
        'see_more_artists': 'see_more_artists',
      },
    },
    'buttons': {
      'primary': 'primary',
      'danger': 'danger',
    },
    'reply': {
      'in_channel': 'in_channel',
      'ephemeral': null,
    },
  },
};
const mockSearchInterface = {
  loadSearch: jest.fn(),
  removeThreeSearches: jest.fn(),
};
const mockBlocks = {
  actionSection: jest.fn(),
  buttonActionElement: jest.fn(),
  contextSection: jest.fn(),
  imageSection: jest.fn(),
  textSection: jest.fn(),
};
const mockSlackApi = {
  postEphemeral: jest.fn(),
  reply: jest.fn(),
};
const mockSlackReply = {
  ephemeralPost: jest.fn(),
  updateReply: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});

jest.mock('/opt/db/search-interface', () => mockSearchInterface, {virtual: true});

jest.mock('/opt/slack/format/slack-format-blocks', () => mockBlocks, {virtual: true});
jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackReply, {virtual: true});

const mod = require('../../../../../src/components/tracks/layers/get-tracks');
const response = mod.RESPONSE;
const {teamId, channelId, userId, triggerId, responseUrl} = require('../../../../data/request');
describe('Get Tracks', () => {
  let stored;
  beforeEach(() => {
    stored = {
      0: {
        'numSearches': 8,
        'searchQuery': 'lime',
        'triggerId': '1175398581988.879979449463.064d0ec64036ef563e9b8d16c54ea1cc',
        'currentSearch': 1,
        'team_channel': 'TRVUTD7DM-CRU3H4MEC',
        'searchItems': [
          {
            'duration': '3:37',
            'art': 'https://i.scdn.co/image/ab67616d00001e02e1225196df3f67528c87c7fd',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'On Our Own',
            'name': 'On Our Own',
            'id': '6tnedmxMVEHzPJfWucWzHo',
            'title': 'Lime Cordiale - On Our Own',
            'uri': 'spotify:track:6tnedmxMVEHzPJfWucWzHo',
            'url': 'https://open.spotify.com/track/6tnedmxMVEHzPJfWucWzHo',
          },
          {
            'duration': '3:29',
            'art': 'https://i.scdn.co/image/ab67616d00001e0226775783c2fb6384ab7fe1e6',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Permanent Vacation',
            'name': 'Temper Temper',
            'id': '3DCU0R5FFaB9GKxZERb5wr',
            'title': 'Lime Cordiale - Temper Temper',
            'uri': 'spotify:track:3DCU0R5FFaB9GKxZERb5wr',
            'url': 'https://open.spotify.com/track/3DCU0R5FFaB9GKxZERb5wr',
          },
          {
            'duration': '3:57',
            'art': 'https://i.scdn.co/image/ab67616d00001e02c84683a0086c3b2d358c857f',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Waking Up Easy',
            'name': 'Waking Up Easy',
            'id': '1mupwOlwPPnX76edNnu2H1',
            'title': 'Lime Cordiale - Waking Up Easy',
            'uri': 'spotify:track:1mupwOlwPPnX76edNnu2H1',
            'url': 'https://open.spotify.com/track/1mupwOlwPPnX76edNnu2H1',
          },
          {
            'duration': '4:20',
            'art': 'https://i.scdn.co/image/ab67616d00001e0272833c1ae3343cbfb4617073',
            'artists': 'Rush',
            'artistsIds': [
              '2Hkut4rAAyrQxRdof7FVJq',
            ],
            'album': 'Moving Pictures (2011 Remaster)',
            'name': 'Limelight',
            'id': '0K6yUnIKNsFtfIpTgGtcHm',
            'title': 'Rush - Limelight',
            'uri': 'spotify:track:0K6yUnIKNsFtfIpTgGtcHm',
            'url': 'https://open.spotify.com/track/0K6yUnIKNsFtfIpTgGtcHm',
          },
          {
            'duration': '3:58',
            'art': 'https://i.scdn.co/image/ab67616d00001e025d94659a5a49a5621702b9b1',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Money',
            'name': 'Money',
            'id': '3TagnFgHBtDptVaDGuzH3a',
            'title': 'Lime Cordiale - Money (Explicit)',
            'uri': 'spotify:track:3TagnFgHBtDptVaDGuzH3a',
            'url': 'https://open.spotify.com/track/3TagnFgHBtDptVaDGuzH3a',
          },
          {
            'duration': '1:51',
            'art': 'https://i.scdn.co/image/ab67616d00001e02b5b973b170a4f4d8f57a216a',
            'artists': 'Minik Jakobsen',
            'artistsIds': [
              '6UJfJw5p9sg08LBKb9Ckfe',
            ],
            'album': 'Limerence',
            'name': 'Limerence',
            'id': '08Zvea0AtpczEW8MOC0i5g',
            'title': 'Minik Jakobsen - Limerence',
            'uri': 'spotify:track:08Zvea0AtpczEW8MOC0i5g',
            'url': 'https://open.spotify.com/track/08Zvea0AtpczEW8MOC0i5g',
          },
          {
            'duration': '2:51',
            'art': 'https://i.scdn.co/image/ab67616d00001e0226775783c2fb6384ab7fe1e6',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Permanent Vacation',
            'name': 'Naturally',
            'id': '74v8vqMR3A1FfxufMugQ7I',
            'title': 'Lime Cordiale - Naturally',
            'uri': 'spotify:track:74v8vqMR3A1FfxufMugQ7I',
            'url': 'https://open.spotify.com/track/74v8vqMR3A1FfxufMugQ7I',
          },
          {
            'duration': '2:55',
            'art': 'https://i.scdn.co/image/ab67616d00001e02c9e60561b2cef4c345ab8fd0',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Dirt Cheap',
            'name': 'Dirt Cheap',
            'id': '12tS8W4qtDOiH3XSlhjE6f',
            'title': 'Lime Cordiale - Dirt Cheap (Explicit)',
            'uri': 'spotify:track:12tS8W4qtDOiH3XSlhjE6f',
            'url': 'https://open.spotify.com/track/12tS8W4qtDOiH3XSlhjE6f',
          },
          {
            'duration': '4:31',
            'art': 'https://i.scdn.co/image/ab67616d00001e020317fc09a60e176a195295e1',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Addicted to the Sunshine',
            'name': 'Addicted to the Sunshine',
            'id': '5ppBE5KFTiTx7JoHQAzr5O',
            'title': 'Lime Cordiale - Addicted to the Sunshine',
            'uri': 'spotify:track:5ppBE5KFTiTx7JoHQAzr5O',
            'url': 'https://open.spotify.com/track/5ppBE5KFTiTx7JoHQAzr5O',
          },
          {
            'duration': '4:15',
            'art': 'https://i.scdn.co/image/ab67616d00001e02bc27c51a7e78eabf43da77cb',
            'artists': 'Just A Gent, ROZES',
            'artistsIds': [
              '1kwGj7uDO5WXVXtQLvGJr0',
              '6jsjhAEteAlY0vCiLvMLBA',
            ],
            'album': 'Limelight (Remixes)',
            'name': 'Limelight - NGHTMRE Remix',
            'id': '1J9KJgXKFRqKGIzmJ7GjS3',
            'title': 'Just A Gent, ROZES - Limelight - NGHTMRE Remix',
            'uri': 'spotify:track:1J9KJgXKFRqKGIzmJ7GjS3',
            'url': 'https://open.spotify.com/track/1J9KJgXKFRqKGIzmJ7GjS3',
          },
          {
            'duration': '4:15',
            'art': 'https://i.scdn.co/image/ab67616d00001e02f997087b745b1d2136cc9cc2',
            'artists': 'Just A Gent, NGHTMRE',
            'artistsIds': [
              '1kwGj7uDO5WXVXtQLvGJr0',
              '76M2Ekj8bG8W7X2nbx2CpF',
            ],
            'album': 'Limelight (NGHTMRE Remix)',
            'name': 'Limelight (NGHTMRE Remix)',
            'id': '3mof6Z6vz6gonsuIEQXank',
            'title': 'Just A Gent, NGHTMRE - Limelight (NGHTMRE Remix)',
            'uri': 'spotify:track:3mof6Z6vz6gonsuIEQXank',
            'url': 'https://open.spotify.com/track/3mof6Z6vz6gonsuIEQXank',
          },
          {
            'duration': '3:29',
            'art': 'https://i.scdn.co/image/ab67616d00001e02c82a951f55ec32c37f84a5b6',
            'artists': 'Magic City Hippies',
            'artistsIds': [
              '1ikg4sypcURm8Vy5GP68xb',
            ],
            'album': 'Hippie Castle EP',
            'name': 'Limestone',
            'id': '00HIh9mVUQQAycsQiciWsh',
            'title': 'Magic City Hippies - Limestone',
            'uri': 'spotify:track:00HIh9mVUQQAycsQiciWsh',
            'url': 'https://open.spotify.com/track/00HIh9mVUQQAycsQiciWsh',
          },
          {
            'duration': '2:55',
            'art': 'https://i.scdn.co/image/ab67616d00001e025e4e5ff5db1dc085cbe23100',
            'artists': 'Caribou',
            'artistsIds': [
              '4aEnNH9PuU1HF3TsZTru54',
            ],
            'album': 'Suddenly',
            'name': 'Lime',
            'id': '2KoLOroO7c5r56NsQky8GH',
            'title': 'Caribou - Lime',
            'uri': 'spotify:track:2KoLOroO7c5r56NsQky8GH',
            'url': 'https://open.spotify.com/track/2KoLOroO7c5r56NsQky8GH',
          },
          {
            'duration': '3:23',
            'art': 'https://i.scdn.co/image/ab67616d00001e0226775783c2fb6384ab7fe1e6',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Permanent Vacation',
            'name': 'Risky Love',
            'id': '3o0ETMSKSzTj2UFOgwREkE',
            'title': 'Lime Cordiale - Risky Love (Explicit)',
            'uri': 'spotify:track:3o0ETMSKSzTj2UFOgwREkE',
            'url': 'https://open.spotify.com/track/3o0ETMSKSzTj2UFOgwREkE',
          },
          {
            'duration': '3:33',
            'art': 'https://i.scdn.co/image/ab67616d00001e0226775783c2fb6384ab7fe1e6',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Permanent Vacation',
            'name': 'Can I Be Your Lover',
            'id': '1aliWa5hnfEq5aLTrOTMtg',
            'title': 'Lime Cordiale - Can I Be Your Lover',
            'uri': 'spotify:track:1aliWa5hnfEq5aLTrOTMtg',
            'url': 'https://open.spotify.com/track/1aliWa5hnfEq5aLTrOTMtg',
          },
          {
            'duration': '5:48',
            'art': 'https://i.scdn.co/image/ab67616d00001e02e83cd94b8475cc0d2bd11f30',
            'artists': 'Yves Tumor',
            'artistsIds': [
              '0qu422H5MOoQxGjd4IzHbS',
            ],
            'album': 'When Man Fails You',
            'name': 'Limerence',
            'id': '1KeUP2WeWCXq3yd7MZsnmN',
            'title': 'Yves Tumor - Limerence',
            'uri': 'spotify:track:1KeUP2WeWCXq3yd7MZsnmN',
            'url': 'https://open.spotify.com/track/1KeUP2WeWCXq3yd7MZsnmN',
          },
          {
            'duration': '3:51',
            'art': 'https://i.scdn.co/image/ab67616d00001e0211e7855fbfb95ee635809c77',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Hanging Upside Down',
            'name': 'Hanging Upside Down',
            'id': '37Kj037Is4AcOvj3vwzN7Z',
            'title': 'Lime Cordiale - Hanging Upside Down',
            'uri': 'spotify:track:37Kj037Is4AcOvj3vwzN7Z',
            'url': 'https://open.spotify.com/track/37Kj037Is4AcOvj3vwzN7Z',
          },
          {
            'duration': '4:30',
            'art': 'https://i.scdn.co/image/ab67616d00001e0271578e5149be57caefd7ede2',
            'artists': 'The Grogans',
            'artistsIds': [
              '3LiQA7CeDBEpoWI0TNBJgv',
            ],
            'album': 'Grogan Grove',
            'name': 'Lemon To My Lime',
            'id': '6Sjzopb5WpPCarvvmEBbJx',
            'title': 'The Grogans - Lemon To My Lime',
            'uri': 'spotify:track:6Sjzopb5WpPCarvvmEBbJx',
            'url': 'https://open.spotify.com/track/6Sjzopb5WpPCarvvmEBbJx',
          },
          {
            'duration': '3:60',
            'art': 'https://i.scdn.co/image/ab67616d00001e027f2ffc82c93849c2dcd85847',
            'artists': 'Houndmouth',
            'artistsIds': [
              '7EGwUS3c5dXduO4sMyLWC5',
            ],
            'album': 'Little Neon Limelight',
            'name': 'Sedona',
            'id': '50fCm9Wuerl1Ram0FUDEaL',
            'title': 'Houndmouth - Sedona',
            'uri': 'spotify:track:50fCm9Wuerl1Ram0FUDEaL',
            'url': 'https://open.spotify.com/track/50fCm9Wuerl1Ram0FUDEaL',
          },
          {
            'duration': '3:41',
            'art': 'https://i.scdn.co/image/ab67616d00001e020d5ce2252d7463c13687f7b6',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Not That Easy',
            'name': 'Not That Easy',
            'id': '6InKbhfioifh4w1IhOIXmJ',
            'title': 'Lime Cordiale - Not That Easy',
            'uri': 'spotify:track:6InKbhfioifh4w1IhOIXmJ',
            'url': 'https://open.spotify.com/track/6InKbhfioifh4w1IhOIXmJ',
          },
          {
            'duration': '3:23',
            'art': 'https://i.scdn.co/image/ab67616d00001e02de63f8b59fe304917b0b53f3',
            'artists': 'Limestone Quarry',
            'artistsIds': [
              '4VhlhOe3FHkPzW4BsYR9EC',
            ],
            'album': 'Samarcande',
            'name': 'Samarcande',
            'id': '0kBBID6PJWjdh0Feew3rtW',
            'title': 'Limestone Quarry - Samarcande',
            'uri': 'spotify:track:0kBBID6PJWjdh0Feew3rtW',
            'url': 'https://open.spotify.com/track/0kBBID6PJWjdh0Feew3rtW',
          },
        ],
        'ttl': 1591602489,
      },
      1: {
        'numSearches': 4,
        'searchQuery': '6yrtCy4XJHXM6tczo4RlTs',
        'triggerId': '1194108397056.879979449463.c1ebc293536e8d7af093a15b9a814414',
        'currentSearch': 4,
        'team_channel': 'TRVUTD7DM-CRU3H4MEC',
        'searchItems': [],
        'ttl': 1591695892,
      },
      2: {
        'numSearches': 8,
        'searchQuery': 'lime',
        'triggerId': '1175398581988.879979449463.064d0ec64036ef563e9b8d16c54ea1cc',
        'currentSearch': 7,
        'team_channel': 'TRVUTD7DM-CRU3H4MEC',
        'searchItems': [
          {
            'duration': '3:60',
            'art': 'https://i.scdn.co/image/ab67616d00001e027f2ffc82c93849c2dcd85847',
            'artists': 'Houndmouth',
            'artistsIds': [
              '7EGwUS3c5dXduO4sMyLWC5',
            ],
            'album': 'Little Neon Limelight',
            'name': 'Sedona',
            'id': '50fCm9Wuerl1Ram0FUDEaL',
            'title': 'Houndmouth - Sedona',
            'uri': 'spotify:track:50fCm9Wuerl1Ram0FUDEaL',
            'url': 'https://open.spotify.com/track/50fCm9Wuerl1Ram0FUDEaL',
          },
          {
            'duration': '3:41',
            'art': 'https://i.scdn.co/image/ab67616d00001e020d5ce2252d7463c13687f7b6',
            'artists': 'Lime Cordiale',
            'artistsIds': [
              '6yrtCy4XJHXM6tczo4RlTs',
            ],
            'album': 'Not That Easy',
            'name': 'Not That Easy',
            'id': '6InKbhfioifh4w1IhOIXmJ',
            'title': 'Lime Cordiale - Not That Easy',
            'uri': 'spotify:track:6InKbhfioifh4w1IhOIXmJ',
            'url': 'https://open.spotify.com/track/6InKbhfioifh4w1IhOIXmJ',
          },
          {
            'duration': '3:23',
            'art': 'https://i.scdn.co/image/ab67616d00001e02de63f8b59fe304917b0b53f3',
            'artists': 'Limestone Quarry',
            'artistsIds': [
              '4VhlhOe3FHkPzW4BsYR9EC',
            ],
            'album': 'Samarcande',
            'name': 'Samarcande',
            'id': '0kBBID6PJWjdh0Feew3rtW',
            'title': 'Limestone Quarry - Samarcande',
            'uri': 'spotify:track:0kBBID6PJWjdh0Feew3rtW',
            'url': 'https://open.spotify.com/track/0kBBID6PJWjdh0Feew3rtW',
          },
        ],
        'ttl': 1591602489,
      },
    };
  });
  const text = {textSection: true};
  const image = {imageSection: true};
  const buttonAction = {buttonAction: true};
  const actionSection = {actionSection: true};
  const contextSection = {context: true};

  it('should get results from Dynamodb and display them after search', async () => {
    const post = {ephemeral: true};
    const displayTracks = stored[0].searchItems.slice(0, mockConfig.slack.limits.max_options);

    mockSearchInterface.loadSearch.mockResolvedValue(stored[0]);
    mockBlocks.textSection.mockReturnValue(text);
    mockBlocks.imageSection.mockReturnValue(image);
    mockBlocks.buttonActionElement.mockReturnValue(buttonAction);
    mockBlocks.actionSection.mockReturnValue(actionSection);
    mockBlocks.contextSection.mockReturnValue(contextSection);
    mockSearchInterface.removeThreeSearches.mockResolvedValue();
    mockSlackReply.ephemeralPost.mockReturnValue(post);

    await expect(mod.showResults(teamId, channelId, userId, triggerId)).resolves.toBe();
    expect(mockSearchInterface.loadSearch).toHaveBeenCalledWith(teamId, channelId, triggerId);
    expect(mockBlocks.textSection).toHaveBeenCalledWith(response.found);
    displayTracks.forEach((t) => {
      const trackPanel = mod.trackPanel(t.name, t.url, t.artists, t.album, t.duration);
      expect(mockBlocks.imageSection).toHaveBeenCalledWith(trackPanel, t.art, 'Album Art');
      expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.tracks.add_to_playlist, `+ Add to playlist`, mod.trackValue(t.title, t.uri, t.id), false, mockConfig.slack.buttons.primary);
    });
    expect(mockBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction]);
    expect(mockBlocks.contextSection).toHaveBeenCalledWith(null, `Page ${stored[0].currentSearch}/${stored[0].numSearches}`);
    expect(mockBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction, buttonAction]);
    expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.tracks.see_more_results, `Next 3 Tracks`, triggerId, false);
    expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.tracks.cancel_search, `Cancel Search`, triggerId, false, mockConfig.slack.buttons.danger);
    expect(mockSearchInterface.removeThreeSearches).toHaveBeenCalledWith(teamId, channelId, triggerId);
    expect(mockSlackReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.found, [text, image, actionSection, image, actionSection, image, actionSection, contextSection, actionSection]);
    expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
  });

  it('should get results from Dynamodb and display them after search, and update reply', async () => {
    const reply = {reply: true};
    const displayTracks = stored[0].searchItems.slice(0, mockConfig.slack.limits.max_options);

    mockSearchInterface.loadSearch.mockResolvedValue(stored[0]);
    mockBlocks.textSection.mockReturnValue(text);
    mockBlocks.imageSection.mockReturnValue(image);
    mockBlocks.buttonActionElement.mockReturnValue(buttonAction);
    mockBlocks.actionSection.mockReturnValue(actionSection);
    mockBlocks.contextSection.mockReturnValue(contextSection);
    mockSearchInterface.removeThreeSearches.mockResolvedValue();
    mockSlackReply.updateReply.mockReturnValue(reply);

    await expect(mod.showResults(teamId, channelId, userId, triggerId, responseUrl)).resolves.toBe();
    expect(mockSearchInterface.loadSearch).toHaveBeenCalledWith(teamId, channelId, triggerId);
    expect(mockBlocks.textSection).toHaveBeenCalledWith(response.found);
    displayTracks.forEach((t) => {
      const trackPanel = mod.trackPanel(t.name, t.url, t.artists, t.album, t.duration);
      expect(mockBlocks.imageSection).toHaveBeenCalledWith(trackPanel, t.art, 'Album Art');
      expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.tracks.add_to_playlist, `+ Add to playlist`, mod.trackValue(t.title, t.uri, t.id), false, mockConfig.slack.buttons.primary);
    });
    expect(mockBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction]);
    expect(mockBlocks.contextSection).toHaveBeenCalledWith(null, `Page ${stored[0].currentSearch}/${stored[0].numSearches}`);
    expect(mockBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction, buttonAction]);
    expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.tracks.see_more_results, `Next 3 Tracks`, triggerId, false);
    expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.tracks.cancel_search, `Cancel Search`, triggerId, false, mockConfig.slack.buttons.danger);
    expect(mockSearchInterface.removeThreeSearches).toHaveBeenCalledWith(teamId, channelId, triggerId);
    expect(mockSlackReply.updateReply).toHaveBeenCalledWith(response.found, [text, image, actionSection, image, actionSection, image, actionSection, contextSection, actionSection]);
    expect(mockSlackApi.reply).toHaveBeenCalledWith(reply, responseUrl);
  });

  it('should show expired', async () => {
    const reply = {reply: true};

    mockSlackReply.updateReply.mockReturnValue(reply);
    mockSearchInterface.loadSearch.mockResolvedValue(stored[1]);

    await expect(mod.showResults(teamId, channelId, userId, triggerId, responseUrl)).resolves.toBe();
    expect(mockSlackReply.updateReply).toHaveBeenCalledWith(response.expired, null);
    expect(mockSlackApi.reply).toHaveBeenCalledWith(reply, responseUrl);
  });

  it('should get results from Dynamodb and leave out the see more results option', async () => {
    const post = {ephemeral: true};
    const displayTracks = stored[2].searchItems.slice(0, mockConfig.slack.limits.max_options);

    mockSearchInterface.loadSearch.mockResolvedValue(stored[2]);
    mockBlocks.textSection.mockReturnValue(text);
    mockBlocks.imageSection.mockReturnValue(image);
    mockBlocks.buttonActionElement.mockReturnValue(buttonAction);
    mockBlocks.actionSection.mockReturnValue(actionSection);
    mockBlocks.contextSection.mockReturnValue(contextSection);
    mockSearchInterface.removeThreeSearches.mockResolvedValue();
    mockSlackReply.ephemeralPost.mockReturnValue(post);

    await expect(mod.showResults(teamId, channelId, userId, triggerId)).resolves.toBe();
    expect(mockSearchInterface.loadSearch).toHaveBeenCalledWith(teamId, channelId, triggerId);
    expect(mockBlocks.textSection).toHaveBeenCalledWith(response.found);
    displayTracks.forEach((t) => {
      const trackPanel = mod.trackPanel(t.name, t.url, t.artists, t.album, t.duration);
      expect(mockBlocks.imageSection).toHaveBeenCalledWith(trackPanel, t.art, 'Album Art');
      expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.tracks.add_to_playlist, `+ Add to playlist`, mod.trackValue(t.title, t.uri, t.id), false, mockConfig.slack.buttons.primary);
    });
    expect(mockBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction]);
    expect(mockBlocks.contextSection).toHaveBeenCalledWith(null, `Page ${stored[2].currentSearch}/${stored[0].numSearches}`);
    expect(mockBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction]);
    expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.tracks.cancel_search, `Cancel Search`, triggerId, false, mockConfig.slack.buttons.danger);
    expect(mockSearchInterface.removeThreeSearches).toHaveBeenCalledWith(teamId, channelId, triggerId);
    expect(mockSlackReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.found, [text, image, actionSection, image, actionSection, image, actionSection, contextSection, actionSection]);
    expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
  });
});
