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

const mod = require('../../../../../src/components/tracks/layers/get-artists');
const response = mod.RESPONSE;
const {teamId, channelId, userId, triggerId, responseUrl} = require('../../../../data/request');
describe('Get Artists', () => {
  let stored;
  beforeEach(() => {
    stored = {
      0: {
        'numSearches': 8,
        'searchQuery': 'lime',
        'triggerId': '1316911665042.879979449463.b398382dfd23d64b2fbf9ab5198f0462',
        'currentSearch': 1,
        'team_channel': 'TRVUTD7DM-CRU3H4MEC',
        'searchItems': [
          {
            'art': 'https://i.scdn.co/image/f2dc443a14ee165ce67641104eb3b352c323cbfc',
            'followers': '511',
            'genres': 'Unknown',
            'name': 'Limes',
            'id': '0qQ81dh9sSdZ1KfnCVJEsK',
            'uri': 'spotify:artist:0qQ81dh9sSdZ1KfnCVJEsK',
            'url': 'https://open.spotify.com/artist/0qQ81dh9sSdZ1KfnCVJEsK',
          },
          {
            'art': 'https://i.scdn.co/image/ad94401ac8e2c62b36d69bbe9ee8732cf05f5b97',
            'followers': '4,765',
            'genres': 'Australian Alternative Rock',
            'name': 'Lime Spiders',
            'id': '00uHQwsBLcSFJpfAxEu7IF',
            'uri': 'spotify:artist:00uHQwsBLcSFJpfAxEu7IF',
            'url': 'https://open.spotify.com/artist/00uHQwsBLcSFJpfAxEu7IF',
          },
          {
            'art': 'https://i.scdn.co/image/5edc41cbae53be42268182a9b8cc3e5c11160a3c',
            'followers': '21,014',
            'genres': 'Disco, Hi-nrg, Italian Disco, Post-disco',
            'name': 'Lime',
            'id': '5ANLE2tGUU9A9w2iqUPlSD',
            'uri': 'spotify:artist:5ANLE2tGUU9A9w2iqUPlSD',
            'url': 'https://open.spotify.com/artist/5ANLE2tGUU9A9w2iqUPlSD',
          },
          {
            'art': 'https://i.scdn.co/image/06f4c2743b03334744332a723107765f2dad1cbd',
            'followers': '103',
            'genres': 'Calming Instrumental',
            'name': 'Limelight Glow',
            'id': '24tFl1Ahli94KF2N76dCEy',
            'uri': 'spotify:artist:24tFl1Ahli94KF2N76dCEy',
            'url': 'https://open.spotify.com/artist/24tFl1Ahli94KF2N76dCEy',
          },
          {
            'art': 'https://i.scdn.co/image/ab67616d00001e028dbde3d39065ce5a3a98ed02',
            'followers': '68',
            'genres': 'Unknown',
            'name': 'Limes In A Cup',
            'id': '1v3fzLGWMfhZgsKQkEiQRc',
            'uri': 'spotify:artist:1v3fzLGWMfhZgsKQkEiQRc',
            'url': 'https://open.spotify.com/artist/1v3fzLGWMfhZgsKQkEiQRc',
          },
          {
            'art': 'https://i.scdn.co/image/ab67616d00001e0272af4fd21b41c16ac815eed3',
            'followers': '993',
            'genres': 'Pop House',
            'name': 'Limelight',
            'id': '6yCsJiCnYI7oviMAXu5T7O',
            'uri': 'spotify:artist:6yCsJiCnYI7oviMAXu5T7O',
            'url': 'https://open.spotify.com/artist/6yCsJiCnYI7oviMAXu5T7O',
          },
          {
            'art': 'https://i.scdn.co/image/a5edb65de3d5aea15b60003096e5973e6f90479c',
            'followers': '13,181',
            'genres': 'Anthem Worship, Ccm, Christian Pop',
            'name': 'Elle Limebear',
            'id': '7MCV4p3QmcYDMTfiE0ZWMD',
            'uri': 'spotify:artist:7MCV4p3QmcYDMTfiE0ZWMD',
            'url': 'https://open.spotify.com/artist/7MCV4p3QmcYDMTfiE0ZWMD',
          },
          {
            'art': 'https://i.scdn.co/image/ab67616d00001e02233912f1c540a870401efa6f',
            'followers': '4,971',
            'genres': 'K-pop Girl Group',
            'name': 'Limesoda',
            'id': '3VZFE0VtlgyCog2X9Cwd2C',
            'uri': 'spotify:artist:3VZFE0VtlgyCog2X9Cwd2C',
            'url': 'https://open.spotify.com/artist/3VZFE0VtlgyCog2X9Cwd2C',
          },
          {
            'art': 'https://i.scdn.co/image/86ca6e0d7236cd172ef71870b7ba0c1ac97e2fbb',
            'followers': '734',
            'genres': 'Unknown',
            'name': 'Limelght',
            'id': '5r7UFAVFWz7LRc3R3esfrK',
            'uri': 'spotify:artist:5r7UFAVFWz7LRc3R3esfrK',
            'url': 'https://open.spotify.com/artist/5r7UFAVFWz7LRc3R3esfrK',
          },
          {
            'art': 'https://i.scdn.co/image/ab67616d00001e02d63e430f3db6a0a40ff25386',
            'followers': '1',
            'genres': 'Unknown',
            'name': 'Lime in Bottle',
            'id': '1FnEY1ew1pYAXiiSt7ros9',
            'uri': 'spotify:artist:1FnEY1ew1pYAXiiSt7ros9',
            'url': 'https://open.spotify.com/artist/1FnEY1ew1pYAXiiSt7ros9',
          },
          {
            'art': 'https://i.scdn.co/image/33163b2cf233d2aee73b4bbab9fe8e4773198343',
            'followers': '648',
            'genres': 'Unknown',
            'name': 'Lime',
            'id': '0tjGIGchMaNMXbJtwuFNOL',
            'uri': 'spotify:artist:0tjGIGchMaNMXbJtwuFNOL',
            'url': 'https://open.spotify.com/artist/0tjGIGchMaNMXbJtwuFNOL',
          },
          {
            'art': 'https://i.scdn.co/image/ab67616d00001e0263a23e80de113eb39f0f025d',
            'followers': '0',
            'genres': 'Unknown',
            'name': 'Limetones',
            'id': '00IXb943VDReNa5zf1e5Zb',
            'uri': 'spotify:artist:00IXb943VDReNa5zf1e5Zb',
            'url': 'https://open.spotify.com/artist/00IXb943VDReNa5zf1e5Zb',
          },
          {
            'art': 'https://i.scdn.co/image/9f7b0d91d104dfd4bfc871f43ebd887b3c1ffe9b',
            'followers': '8,382',
            'genres': 'Darkstep, Neurofunk, Ukrainian Electronic',
            'name': 'Limewax',
            'id': '1mCm9sqidA8YS31nVyvlXM',
            'uri': 'spotify:artist:1mCm9sqidA8YS31nVyvlXM',
            'url': 'https://open.spotify.com/artist/1mCm9sqidA8YS31nVyvlXM',
          },
          {
            'art': 'https://i.scdn.co/image/b9092ce95698cd9ab763ae2a6d71df435e783ebb',
            'followers': '121',
            'genres': 'Unknown',
            'name': 'Limeburner',
            'id': '1WO9jLDIQr8eTIWlDrVkyK',
            'uri': 'spotify:artist:1WO9jLDIQr8eTIWlDrVkyK',
            'url': 'https://open.spotify.com/artist/1WO9jLDIQr8eTIWlDrVkyK',
          },
          {
            'art': 'https://i.scdn.co/image/ab67616d00001e021778b4c15b384d319b2939f6',
            'followers': '67',
            'genres': 'Unknown',
            'name': 'Lime Soda',
            'id': '7o1wy5GkGFQzbc9g0rly71',
            'uri': 'spotify:artist:7o1wy5GkGFQzbc9g0rly71',
            'url': 'https://open.spotify.com/artist/7o1wy5GkGFQzbc9g0rly71',
          },
          {
            'art': 'https://i.scdn.co/image/6d85513d64e5664479629d84b92667273444b7a4',
            'followers': '8,605',
            'genres': 'Disco House, Diva House, Hip House, Vocal House',
            'name': 'Alison Limerick',
            'id': '0ELXBCSsRl2m92MgnOsA69',
            'uri': 'spotify:artist:0ELXBCSsRl2m92MgnOsA69',
            'url': 'https://open.spotify.com/artist/0ELXBCSsRl2m92MgnOsA69',
          },
          {
            'art': 'https://i.scdn.co/image/ab67616d00001e02a88f1114c9972d0dce7b41a5',
            'followers': '74',
            'genres': 'Unknown',
            'name': 'Limetra',
            'id': '1fuMMSlAf7qCgSwfLF0Dx7',
            'uri': 'spotify:artist:1fuMMSlAf7qCgSwfLF0Dx7',
            'url': 'https://open.spotify.com/artist/1fuMMSlAf7qCgSwfLF0Dx7',
          },
          {
            'art': 'https://i.scdn.co/image/ab67616d00001e02e8ab306e2a7cadb1541f162a',
            'followers': '8,622',
            'genres': 'American Folk Revival, Traditional Folk',
            'name': 'The Limeliters',
            'id': '08Zx5pufnilNAjm28CauiH',
            'uri': 'spotify:artist:08Zx5pufnilNAjm28CauiH',
            'url': 'https://open.spotify.com/artist/08Zx5pufnilNAjm28CauiH',
          },
          {
            'art': null,
            'followers': '328',
            'genres': 'Unknown',
            'name': 'Tobago and d\'Lime',
            'id': '0qOLVVJ4c5I4v4jm5ogHqT',
            'uri': 'spotify:artist:0qOLVVJ4c5I4v4jm5ogHqT',
            'url': 'https://open.spotify.com/artist/0qOLVVJ4c5I4v4jm5ogHqT',
          },
          {
            'art': null,
            'followers': '355',
            'genres': 'Unknown',
            'name': 'Limendinger',
            'id': '4f5JQgWXT7p5452bwtKw1w',
            'uri': 'spotify:artist:4f5JQgWXT7p5452bwtKw1w',
            'url': 'https://open.spotify.com/artist/4f5JQgWXT7p5452bwtKw1w',
          },
          {
            'art': 'https://i.scdn.co/image/7baaf03a78e718f697bcef32734897e14ecc34d1',
            'followers': '2,899',
            'genres': 'Breakcore',
            'name': 'Drop The Lime',
            'id': '54xplVPon9LqkbO5PXUCBG',
            'uri': 'spotify:artist:54xplVPon9LqkbO5PXUCBG',
            'url': 'https://open.spotify.com/artist/54xplVPon9LqkbO5PXUCBG',
          },
        ],
        'ttl': 1598186595,
      },
      1: {
        'numSearches': 8,
        'searchQuery': 'lime',
        'triggerId': '1316911665042.879979449463.b398382dfd23d64b2fbf9ab5198f0462',
        'currentSearch': 8,
        'team_channel': 'TRVUTD7DM-CRU3H4MEC',
        'searchItems': [],
        'ttl': 1598186595,
      },
      2: {
        'numSearches': 8,
        'searchQuery': 'lime',
        'triggerId': '1316911665042.879979449463.b398382dfd23d64b2fbf9ab5198f0462',
        'currentSearch': 7,
        'team_channel': 'TRVUTD7DM-CRU3H4MEC',
        'searchItems': [
          {
            'art': null,
            'followers': '328',
            'genres': 'Unknown',
            'name': 'Tobago and d\'Lime',
            'id': '0qOLVVJ4c5I4v4jm5ogHqT',
            'uri': 'spotify:artist:0qOLVVJ4c5I4v4jm5ogHqT',
            'url': 'https://open.spotify.com/artist/0qOLVVJ4c5I4v4jm5ogHqT',
          },
          {
            'art': null,
            'followers': '355',
            'genres': 'Unknown',
            'name': 'Limendinger',
            'id': '4f5JQgWXT7p5452bwtKw1w',
            'uri': 'spotify:artist:4f5JQgWXT7p5452bwtKw1w',
            'url': 'https://open.spotify.com/artist/4f5JQgWXT7p5452bwtKw1w',
          },
          {
            'art': 'https://i.scdn.co/image/7baaf03a78e718f697bcef32734897e14ecc34d1',
            'followers': '2,899',
            'genres': 'Breakcore',
            'name': 'Drop The Lime',
            'id': '54xplVPon9LqkbO5PXUCBG',
            'uri': 'spotify:artist:54xplVPon9LqkbO5PXUCBG',
            'url': 'https://open.spotify.com/artist/54xplVPon9LqkbO5PXUCBG',
          },
        ],
        'ttl': 1598186595,
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
    const displayArtists = stored[0].searchItems.slice(0, mockConfig.slack.limits.max_options);

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
    displayArtists.forEach((t) => {
      const artistPanel = mod.artistPanel(t.name, t.url, t.genres, t.followers);
      expect(mockBlocks.imageSection).toHaveBeenCalledWith(artistPanel, t.art, 'Artist Art');
      expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.artists.view_artist_tracks, `View Artist Tracks`, t.id, false, mockConfig.slack.buttons.primary);
    });
    expect(mockBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction]);
    expect(mockBlocks.contextSection).toHaveBeenCalledWith(null, `Page ${stored[0].currentSearch}/${stored[0].numSearches}`);
    expect(mockBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction, buttonAction]);
    expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.artists.see_more_artists, `Next 3 Artists`, triggerId, false);
    expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.tracks.cancel_search, `Cancel Search`, triggerId, false, mockConfig.slack.buttons.danger);
    expect(mockSearchInterface.removeThreeSearches).toHaveBeenCalledWith(teamId, channelId, triggerId);
    expect(mockSlackReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.found, [text, image, actionSection, image, actionSection, image, actionSection, contextSection, actionSection]);
    expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
  });

  it('should get results from Dynamodb and display them after search, and update reply', async () => {
    const reply = {reply: true};
    const displayArtists = stored[0].searchItems.slice(0, mockConfig.slack.limits.max_options);

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
    displayArtists.forEach((t) => {
      const artistPanel = mod.artistPanel(t.name, t.url, t.genres, t.followers);
      expect(mockBlocks.imageSection).toHaveBeenCalledWith(artistPanel, t.art, 'Artist Art');
      expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.artists.view_artist_tracks, `View Artist Tracks`, t.id, false, mockConfig.slack.buttons.primary);
    });
    expect(mockBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction]);
    expect(mockBlocks.contextSection).toHaveBeenCalledWith(null, `Page ${stored[0].currentSearch}/${stored[0].numSearches}`);
    expect(mockBlocks.actionSection).toHaveBeenCalledWith(null, [buttonAction, buttonAction]);
    expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.artists.see_more_artists, `Next 3 Artists`, triggerId, false);
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
    const displayArtists = stored[2].searchItems.slice(0, mockConfig.slack.limits.max_options);

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
    displayArtists.forEach((t) => {
      const artistPanel = mod.artistPanel(t.name, t.url, t.genres, t.followers);
      expect(mockBlocks.imageSection).toHaveBeenCalledWith(artistPanel, t.art, 'Artist Art');
      expect(mockBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.artists.view_artist_tracks, `View Artist Tracks`, t.id, false, mockConfig.slack.buttons.primary);
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
