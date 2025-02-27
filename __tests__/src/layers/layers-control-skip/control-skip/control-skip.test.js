describe('control-skip', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
});
const mockConfig = {
  'dynamodb': {
    'skip': {
      'max_history': 10,
    },
  },
  'slack': {
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
        'pause': 'pause',
        'skip': 'skip',
        'reset': 'reset',
        'clear_one': 'clear_one',
        'jump_to_start': 'jump_to_start',
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
  },
};
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};
const mockSns = {
  publish: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};
const mockSpotifyPlaylists = {
  deleteTracks: jest.fn(),
};
const mockSpotifyPlayback = {
  skip: jest.fn(),
};
const mockSpotifyHelper = {
  onPlaylist: jest.fn(),
};
const mockSlackApi = {
  deleteChat: jest.fn(),
  post: jest.fn(),
  postEphemeral: jest.fn(),
  updateChat: jest.fn(),
};
const mockSlackBlocks = {
  textSection: jest.fn(),
  actionSection: jest.fn(),
  buttonActionElement: jest.fn(),
  contextSection: jest.fn(),
};
const mockSlackFormatReply = {
  deleteMessage: jest.fn(),
  ephemeralPost: jest.fn(),
  inChannelPost: jest.fn(),
  messageUpdate: jest.fn(),
};
const mockSettingsExtra = {
  changeSkipAddVote: jest.fn(),
  changeSkipAddHistory: jest.fn(),
  changeSkipTrimHistory: jest.fn(),
  loadBlacklist: jest.fn(),
  loadSkip: jest.fn(),
};

jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});

jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playlists', () => mockSpotifyPlaylists, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-playback', () => mockSpotifyPlayback, {virtual: true});
jest.mock('/opt/spotify/spotify-helper', () => mockSpotifyHelper, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-reply', () => mockSlackFormatReply, {virtual: true});
jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackBlocks, {virtual: true});

jest.mock('/opt/db/settings-extra-interface', () => mockSettingsExtra, {virtual: true});

const mod = require('../../../../../src/layers/layers-control-skip/control-skip/control-skip');
const response = mod.RESPONSE;
const {teamId, channelId, settings, userId} = require('../../../../data/request');
const status = require('../../../../data/spotify/status');

describe('getSkipBlock', () => {
  it('should get a skip block', async () => {
    const votesNeeded = 2;
    const track = 'awesome track';
    const id = 'id';
    const textSection = {text: true};
    const contextSection = {context: true};
    const actionSection = {action: true};
    const button = {element: true};

    mockSlackBlocks.textSection.mockReturnValue(textSection);
    mockSlackBlocks.contextSection.mockReturnValue(contextSection);
    mockSlackBlocks.actionSection.mockReturnValue(actionSection);
    mockSlackBlocks.buttonActionElement.mockReturnValue(button);

    await expect(mod.getSkipBlock(userId, votesNeeded, track, id, [userId])).toStrictEqual([textSection, contextSection, contextSection, actionSection]);
    expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.request(userId, track));
    expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.votesNeeded(votesNeeded));
    expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.voters([userId]));
    expect(mockSlackBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.skip_vote, response.button, id);
    expect(mockSlackBlocks.actionSection).toHaveBeenCalledWith(mockConfig.slack.actions.skip_vote, [button]);
  });
});

describe('onBlacklist', () => {
  beforeEach(() => {
    mockSns.publish.mockReturnThis();
  });
  it('should detect that current track playing is on Blacklist, on playlist and delete it', async () => {
    const auth = {auth: true};
    const statusTrack = {uri: status[0].item.uri, title: 'status track title'};
    const blacklist = {blacklist: [{uri: status[0].item.uri}, {uri: 'otherUri'}]};
    const post = {inChannel: true};

    mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
    mockSlackFormatReply.inChannelPost.mockReturnValue(post);
    mockSettingsExtra.changeSkipAddHistory.mockResolvedValue();
    mockSpotifyHelper.onPlaylist.mockReturnValue(true);

    await expect(mod.onBlacklist(teamId, channelId, auth, settings, settings.playlist, status[0], statusTrack)).resolves.toBe(true);
    expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
    expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.blacklist(statusTrack.title, true));
    expect(mockSpotifyPlaylists.deleteTracks).toHaveBeenCalledWith(auth, settings.playlist.id, [{uri: statusTrack.uri}]);
    expect(mockSlackApi.post).toHaveBeenCalledWith(post);
  });

  it('should detect that current track playing is on Blacklist, not on playlist', async () => {
    const auth = {auth: true};
    const statusTrack = {id: status[0].item.id, title: 'status track title'};
    const blacklist = {blacklist: [{id: status[0].item.id}, {id: 'otherId'}]};
    const post = {inChannel: true};

    mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
    mockSlackFormatReply.inChannelPost.mockReturnValue(post);
    mockSettingsExtra.changeSkipAddHistory.mockResolvedValue();
    mockSpotifyHelper.onPlaylist.mockReturnValue(false);

    await expect(mod.onBlacklist(teamId, channelId, auth, settings, settings.playlist, status[0], statusTrack)).resolves.toBe(true);
    expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
    expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.blacklist(statusTrack.title));
    expect(mockSpotifyPlaylists.deleteTracks).not.toHaveBeenCalled();
    expect(mockSlackApi.post).toHaveBeenCalledWith(post);
  });

  it('should detect that current track is not on blacklist and return false', async () => {
    const auth = {auth: true};
    const statusTrack = {id: status[0].item.id, title: 'status track title'};
    const blacklist = {blacklist: [{id: 'otherUri'}]};
    const post = {inChannel: true};

    mockSettingsExtra.loadBlacklist.mockResolvedValue(blacklist);
    mockSlackFormatReply.inChannelPost.mockReturnValue(post);
    mockSettingsExtra.changeSkipAddHistory.mockResolvedValue();
    mockSpotifyHelper.onPlaylist.mockReturnValue(false);

    await expect(mod.onBlacklist(teamId, channelId, auth, settings, settings.playlist, status[0], statusTrack)).resolves.toBe(false);
    expect(mockSettingsExtra.loadBlacklist).toHaveBeenCalledWith(teamId, channelId);
  });
});

describe('skipTrack', () => {
  beforeEach(() => {
    mockSns.publish.mockReturnThis();
  });
  it('should skip track, add to history and then trim history', async () => {
    const auth = {auth: true};
    const statusTrack = {id: status[0].item.id, title: 'status track title'};
    const post = {inChannel: true};
    const data = {
      'Attributes': {
        'skip': null,
        'votes': null,
        'history': [
          {
            'id': '6jVy9OEtu7VJyPrrHG25jb',
            'title': 'Sam Allen - Barricade',
          },
          {
            'id': '34gCuhDGsG4bRPIf9bb02f',
            'title': 'Ed Sheeran - Thinking out Loud',
          },
          {
            'id': '579j0QRchEajNo11kaaAUx',
            'title': 'San Cisco - When I Dream',
          },
          {
            'id': '4ztnd2IahPRr3wk9FPwiGV',
            'title': 'San Cisco - On The Line',
          },
          {
            'id': '6RMvf7OCYYSw4x2K8UakDt',
            'title': 'E^ST - TALK DEEP',
          },
          {
            'id': '4Yf4s4P1vfJb8hDvnxCbMx',
            'title': 'Thundamentals - Everybody But You (Explicit)',
          },
          {
            'id': '3yXgttblOo006gd4eGOvw1',
            'title': 'The Jungle Giants - Heavy Hearted',
          },
          {
            'id': '1gV1kl0v2aUGHz1qNJGOQJ',
            'title': 'San Cisco - 4EVER - triple j Like A Version',
          },
          {
            'id': '1mupwOlwPPnX76edNnu2H1',
            'title': 'Lime Cordiale - Waking Up Easy',
          },
          {
            'id': '102xchwCIiVXTmky0OriKp',
            'title': 'Tia Gostelow, LANKS - Strangers',
          },
        ],
      },
    };

    mockSlackFormatReply.inChannelPost.mockReturnValue(post);
    mockSettingsExtra.changeSkipAddHistory.mockResolvedValue(data);
    mockSpotifyHelper.onPlaylist.mockReturnValue(true);

    await expect(mod.skipTrack(teamId, channelId, auth, settings, statusTrack)).resolves.toBe();
    expect(mockSettingsExtra.changeSkipAddHistory).toHaveBeenCalledWith(teamId, channelId, statusTrack);
    expect(mockSettingsExtra.changeSkipTrimHistory).toHaveBeenCalledWith(teamId, channelId);
    expect(mockSpotifyPlayback.skip).toHaveBeenCalledWith(auth);
    expect(mockSns.publish).toHaveBeenCalledWith({
      Message: JSON.stringify({
        teamId,
        channelId,
        settings,
        afterSkip: true,
      }),
      TopicArn: process.env.SNS_PREFIX + 'tracks-current',
    });
  });

  it('should skip track, add to history and then not trim history', async () => {
    const auth = {auth: true};
    const statusTrack = {id: status[0].item.id, title: 'status track title'};
    const post = {inChannel: true};
    const data = {
      'Attributes': {
        'skip': null,
        'votes': null,
        'history': [
          {
            'id': '6jVy9OEtu7VJyPrrHG25jb',
            'title': 'Sam Allen - Barricade',
          },
          {
            'id': '34gCuhDGsG4bRPIf9bb02f',
            'title': 'Ed Sheeran - Thinking out Loud',
          },
          {
            'id': '579j0QRchEajNo11kaaAUx',
            'title': 'San Cisco - When I Dream',
          },
          {
            'id': '4ztnd2IahPRr3wk9FPwiGV',
            'title': 'San Cisco - On The Line',
          },
          {
            'id': '6RMvf7OCYYSw4x2K8UakDt',
            'title': 'E^ST - TALK DEEP',
          },
          {
            'id': '4Yf4s4P1vfJb8hDvnxCbMx',
            'title': 'Thundamentals - Everybody But You (Explicit)',
          },
          {
            'id': '3yXgttblOo006gd4eGOvw1',
            'title': 'The Jungle Giants - Heavy Hearted',
          },
          {
            'id': '1gV1kl0v2aUGHz1qNJGOQJ',
            'title': 'San Cisco - 4EVER - triple j Like A Version',
          },
          {
            'id': '102xchwCIiVXTmky0OriKp',
            'title': 'Tia Gostelow, LANKS - Strangers',
          },
        ],
      },
    };

    mockSlackFormatReply.inChannelPost.mockReturnValue(post);
    mockSettingsExtra.changeSkipAddHistory.mockResolvedValue(data);
    mockSpotifyHelper.onPlaylist.mockReturnValue(true);

    await expect(mod.skipTrack(teamId, channelId, auth, settings, statusTrack)).resolves.toBe();
    expect(mockSettingsExtra.changeSkipAddHistory).toHaveBeenCalledWith(teamId, channelId, statusTrack);
    expect(mockSettingsExtra.changeSkipTrimHistory).not.toHaveBeenCalled();
    expect(mockSpotifyPlayback.skip).toHaveBeenCalledWith(auth);
    expect(mockSns.publish).toHaveBeenCalledWith({
      Message: JSON.stringify({
        teamId,
        channelId,
        settings,
        afterSkip: true,
      }),
      TopicArn: process.env.SNS_PREFIX + 'tracks-current',
    });
  });

  it('should skip track, add to history fails (race condition)', async () => {
    const auth = {auth: true};
    const statusTrack = {id: status[0].item.id, title: 'status track title'};
    const post = {inChannel: true};
    const error = new Error('dynamo error');
    error.code = 'ConditionalCheckFailedException';

    mockSlackFormatReply.inChannelPost.mockReturnValue(post);
    mockSettingsExtra.changeSkipAddHistory.mockRejectedValue(error);
    mockSpotifyHelper.onPlaylist.mockReturnValue(true);

    await expect(mod.skipTrack(teamId, channelId, auth, settings, statusTrack)).resolves.toBe();
    expect(mockSettingsExtra.changeSkipAddHistory).toHaveBeenCalledWith(teamId, channelId, {id: statusTrack.id, title: statusTrack.title});
    expect(mockSettingsExtra.changeSkipTrimHistory).not.toHaveBeenCalled();
    expect(mockSpotifyPlayback.skip).toHaveBeenCalledWith(auth);
    expect(mockSns.publish).toHaveBeenCalledWith({
      Message: JSON.stringify({
        teamId,
        channelId,
        settings,
        afterSkip: true,
      }),
      TopicArn: process.env.SNS_PREFIX + 'tracks-current',
    });
  });

  it('should skip track, add to history fails (unknown error)', async () => {
    const auth = {auth: true};
    const statusTrack = {id: status[0].item.id, title: 'status track title'};
    const post = {inChannel: true};
    const error = new Error('dynamo error');

    mockSlackFormatReply.inChannelPost.mockReturnValue(post);
    mockSettingsExtra.changeSkipAddHistory.mockRejectedValue(error);
    mockSpotifyHelper.onPlaylist.mockReturnValue(true);

    await expect(mod.skipTrack(teamId, channelId, auth, settings, statusTrack)).rejects.toBe(error);
    expect(mockSettingsExtra.changeSkipAddHistory).toHaveBeenCalledWith(teamId, channelId, {id: statusTrack.id, title: statusTrack.title});
    expect(mockSettingsExtra.changeSkipTrimHistory).not.toHaveBeenCalled();
    expect(mockSpotifyPlayback.skip).toHaveBeenCalledWith(auth);
  });
});

describe('addVote', () => {
  beforeEach(() => {
    mockSns.publish.mockReturnThis();
  });
  it('should add a vote to the skip', async () => {
    const auth = {auth: true};
    const statusTrack = {id: status[0].item.id, title: 'status track title'};
    const currentSkip = {
      'skip': {
        'track': {
          'duration': '3:48',
          'art': 'https://i.scdn.co/image/ab67616d00001e02334267c57b1e0d9d62239fde',
          'artists': 'Hermitude',
          'artistsIds': [
            '3fmMaLC5jjf2N4EC2kTx0u',
          ],
          'album': 'TheSoundYouNeed, Vol. 1',
          'name': 'Ukiyo',
          'id': '3nKx86fcs8MYMydill0Sya',
          'title': 'Hermitude - Ukiyo',
          'uri': 'spotify:track:3nKx86fcs8MYMydill0Sya',
          'url': 'https://open.spotify.com/track/3nKx86fcs8MYMydill0Sya',
        },
        'timestamp': '1597585709.000800',
      },
      'votes': {
        'users': [
          'URVUTD7UP2',
        ],
        'votesNeeded': 3,
      },
      'history': [
        {
          'id': '6jVy9OEtu7VJyPrrHG25jb',
          'title': 'Sam Allen - Barricade',
        },
        {
          'id': '34gCuhDGsG4bRPIf9bb02f',
          'title': 'Ed Sheeran - Thinking out Loud',
        },
        {
          'id': '579j0QRchEajNo11kaaAUx',
          'title': 'San Cisco - When I Dream',
        },
        {
          'id': '4ztnd2IahPRr3wk9FPwiGV',
          'title': 'San Cisco - On The Line',
        },
        {
          'id': '6RMvf7OCYYSw4x2K8UakDt',
          'title': 'E^ST - TALK DEEP',
        },
      ],
    };
    const textSection = {text: true};
    const contextSection = {context: true};
    const actionSection = {action: true};
    const button = {element: true};
    const update = {updateMessage: true};

    mockSlackBlocks.textSection.mockReturnValue(textSection);
    mockSlackBlocks.contextSection.mockReturnValue(contextSection);
    mockSlackBlocks.actionSection.mockReturnValue(actionSection);
    mockSlackBlocks.buttonActionElement.mockReturnValue(button);
    mockSettingsExtra.changeSkipAddVote.mockResolvedValue();
    mockSlackFormatReply.messageUpdate.mockReturnValue(update);

    await expect(mod.addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack)).resolves.toBe();
    expect(mockSlackBlocks.textSection).toHaveBeenCalledWith(response.request(userId, statusTrack.title));
    expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.votesNeeded(currentSkip.votes.votesNeeded - currentSkip.votes.users.length));
    expect(mockSlackBlocks.contextSection).toHaveBeenCalledWith(null, response.voters(currentSkip.votes.users));
    expect(mockSlackBlocks.buttonActionElement).toHaveBeenCalledWith(mockConfig.slack.actions.skip_vote, response.button, statusTrack.id);
    expect(mockSlackFormatReply.messageUpdate).toHaveBeenCalledWith(channelId, currentSkip.skip.timestamp, response.request(currentSkip.votes.users[0], currentSkip.skip.track.title), [
      textSection, contextSection, contextSection, actionSection,
    ]);
    expect(mockSlackApi.updateChat).toHaveBeenCalledWith(update);
  });

  it('should add a vote to the skip and hit a race condition, to be resolved by slack', async () => {
    const error = new Error();
    error.code = 'ConditionalCheckFailedException';
    const auth = {auth: true};
    const statusTrack = {uri: status[0].item.uri, title: 'status track title'};
    const currentSkip = {
      'skip': {
        'track': {
          'duration': '3:48',
          'art': 'https://i.scdn.co/image/ab67616d00001e02334267c57b1e0d9d62239fde',
          'artists': 'Hermitude',
          'artistsIds': [
            '3fmMaLC5jjf2N4EC2kTx0u',
          ],
          'album': 'TheSoundYouNeed, Vol. 1',
          'name': 'Ukiyo',
          'id': '3nKx86fcs8MYMydill0Sya',
          'title': 'Hermitude - Ukiyo',
          'uri': 'spotify:track:3nKx86fcs8MYMydill0Sya',
          'url': 'https://open.spotify.com/track/3nKx86fcs8MYMydill0Sya',
        },
        'timestamp': '1597585709.000800',
      },
      'votes': {
        'users': [
          'URVUTD7UP2',
        ],
        'votesNeeded': 3,
      },
      'history': [
        {
          'id': '6jVy9OEtu7VJyPrrHG25jb',
          'title': 'Sam Allen - Barricade',
        },
        {
          'id': '34gCuhDGsG4bRPIf9bb02f',
          'title': 'Ed Sheeran - Thinking out Loud',
        },
        {
          'id': '579j0QRchEajNo11kaaAUx',
          'title': 'San Cisco - When I Dream',
        },
        {
          'id': '4ztnd2IahPRr3wk9FPwiGV',
          'title': 'San Cisco - On The Line',
        },
        {
          'id': '6RMvf7OCYYSw4x2K8UakDt',
          'title': 'E^ST - TALK DEEP',
        },
      ],
    };
    const currentSkip2 = {
      'skip': {
        'track': {
          'duration': '3:48',
          'art': 'https://i.scdn.co/image/ab67616d00001e02334267c57b1e0d9d62239fde',
          'artists': 'Hermitude',
          'artistsIds': [
            '3fmMaLC5jjf2N4EC2kTx0u',
          ],
          'album': 'TheSoundYouNeed, Vol. 1',
          'name': 'Ukiyo',
          'id': '3nKx86fcs8MYMydill0Sya',
          'title': 'Hermitude - Ukiyo',
          'uri': 'spotify:track:3nKx86fcs8MYMydill0Sya',
          'url': 'https://open.spotify.com/track/3nKx86fcs8MYMydill0Sya',
        },
        'timestamp': '1597585709.000800',
      },
      'votes': {
        'users': [
          'URVUTD7UP2',
          'USER2',
          'USER3',
        ],
        'votesNeeded': 3,
      },
      'history': [
        {
          'id': '6jVy9OEtu7VJyPrrHG25jb',
          'title': 'Sam Allen - Barricade',
        },
        {
          'id': '34gCuhDGsG4bRPIf9bb02f',
          'title': 'Ed Sheeran - Thinking out Loud',
        },
        {
          'id': '579j0QRchEajNo11kaaAUx',
          'title': 'San Cisco - When I Dream',
        },
        {
          'id': '4ztnd2IahPRr3wk9FPwiGV',
          'title': 'San Cisco - On The Line',
        },
        {
          'id': '6RMvf7OCYYSw4x2K8UakDt',
          'title': 'E^ST - TALK DEEP',
        },
      ],
    };
    const update = {updateMessage: true};
    mockSettingsExtra.changeSkipAddVote.mockRejectedValue(error);
    mockSlackFormatReply.messageUpdate.mockReturnValue(update);
    mockSlackApi.deleteChat.mockResolvedValue();
    mockSettingsExtra.loadSkip.mockResolvedValue(currentSkip2);
    mockSettingsExtra.changeSkipAddHistory.mockResolvedValue();

    await expect(mod.addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack)).resolves.toBe();
  });
  it('should add a vote to the skip call resolve skip', async () => {
    const error = new Error();
    error.code = 'ConditionalCheckFailedException';
    const auth = {auth: true};
    const statusTrack = {uri: status[0].item.uri, title: 'status track title'};
    const currentSkip = {
      'skip': {
        'track': {
          'duration': '3:48',
          'art': 'https://i.scdn.co/image/ab67616d00001e02334267c57b1e0d9d62239fde',
          'artists': 'Hermitude',
          'artistsIds': [
            '3fmMaLC5jjf2N4EC2kTx0u',
          ],
          'album': 'TheSoundYouNeed, Vol. 1',
          'name': 'Ukiyo',
          'id': '3nKx86fcs8MYMydill0Sya',
          'title': 'Hermitude - Ukiyo',
          'uri': 'spotify:track:3nKx86fcs8MYMydill0Sya',
          'url': 'https://open.spotify.com/track/3nKx86fcs8MYMydill0Sya',
        },
        'timestamp': '1597585709.000800',
      },
      'votes': {
        'users': [
          'URVUTD7UP2',
        ],
        'votesNeeded': 2,
      },
      'history': [
        {
          'id': '6jVy9OEtu7VJyPrrHG25jb',
          'title': 'Sam Allen - Barricade',
        },
        {
          'id': '34gCuhDGsG4bRPIf9bb02f',
          'title': 'Ed Sheeran - Thinking out Loud',
        },
        {
          'id': '579j0QRchEajNo11kaaAUx',
          'title': 'San Cisco - When I Dream',
        },
        {
          'id': '4ztnd2IahPRr3wk9FPwiGV',
          'title': 'San Cisco - On The Line',
        },
        {
          'id': '6RMvf7OCYYSw4x2K8UakDt',
          'title': 'E^ST - TALK DEEP',
        },
      ],
    };
    const update = {updateMessage: true};
    mockSettingsExtra.changeSkipAddVote.mockRejectedValue(error);
    mockSlackFormatReply.messageUpdate.mockReturnValue(update);
    mockSlackApi.deleteChat.mockResolvedValue();
    mockSettingsExtra.changeSkipAddHistory.mockResolvedValue();

    await expect(mod.addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack)).resolves.toBe();
  });
  it('should tell the user that they have already voted', async () => {
    const auth = {auth: true};
    const statusTrack = {uri: status[0].item.uri, title: 'status track title'};
    const currentSkip = {
      'skip': {
        'track': {
          'duration': '3:48',
          'art': 'https://i.scdn.co/image/ab67616d00001e02334267c57b1e0d9d62239fde',
          'artists': 'Hermitude',
          'artistsIds': [
            '3fmMaLC5jjf2N4EC2kTx0u',
          ],
          'album': 'TheSoundYouNeed, Vol. 1',
          'name': 'Ukiyo',
          'id': '3nKx86fcs8MYMydill0Sya',
          'title': 'Hermitude - Ukiyo',
          'uri': 'spotify:track:3nKx86fcs8MYMydill0Sya',
          'url': 'https://open.spotify.com/track/3nKx86fcs8MYMydill0Sya',
        },
        'timestamp': '1597585709.000800',
      },
      'votes': {
        'users': [
          userId,
        ],
        'votesNeeded': 2,
      },
      'history': [
        {
          'id': '6jVy9OEtu7VJyPrrHG25jb',
          'title': 'Sam Allen - Barricade',
        },
        {
          'id': '34gCuhDGsG4bRPIf9bb02f',
          'title': 'Ed Sheeran - Thinking out Loud',
        },
        {
          'id': '579j0QRchEajNo11kaaAUx',
          'title': 'San Cisco - When I Dream',
        },
        {
          'id': '4ztnd2IahPRr3wk9FPwiGV',
          'title': 'San Cisco - On The Line',
        },
        {
          'id': '6RMvf7OCYYSw4x2K8UakDt',
          'title': 'E^ST - TALK DEEP',
        },
      ],
    };
    const post = {ephemeral: true};

    mockSlackFormatReply.ephemeralPost.mockReturnValue(post);

    await expect(mod.addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack)).resolves.toBe();
    expect(mockSlackFormatReply.ephemeralPost).toHaveBeenCalledWith(channelId, userId, response.already, null);
    expect(mockSlackApi.postEphemeral).toHaveBeenCalledWith(post);
  });
  it('should throw an error when an uncategorised error is thrown', async () => {
    const error = new Error('random');
    const auth = {auth: true};
    const statusTrack = {uri: status[0].item.uri, title: 'status track title'};
    const currentSkip = {
      'skip': {
        'track': {
          'duration': '3:48',
          'art': 'https://i.scdn.co/image/ab67616d00001e02334267c57b1e0d9d62239fde',
          'artists': 'Hermitude',
          'artistsIds': [
            '3fmMaLC5jjf2N4EC2kTx0u',
          ],
          'album': 'TheSoundYouNeed, Vol. 1',
          'name': 'Ukiyo',
          'id': '3nKx86fcs8MYMydill0Sya',
          'title': 'Hermitude - Ukiyo',
          'uri': 'spotify:track:3nKx86fcs8MYMydill0Sya',
          'url': 'https://open.spotify.com/track/3nKx86fcs8MYMydill0Sya',
        },
        'timestamp': '1597585709.000800',
      },
      'votes': {
        'users': [
          'URVUTD7UP2',
        ],
        'votesNeeded': 3,
      },
      'history': [
        {
          'id': '6jVy9OEtu7VJyPrrHG25jb',
          'title': 'Sam Allen - Barricade',
        },
        {
          'id': '34gCuhDGsG4bRPIf9bb02f',
          'title': 'Ed Sheeran - Thinking out Loud',
        },
        {
          'id': '579j0QRchEajNo11kaaAUx',
          'title': 'San Cisco - When I Dream',
        },
        {
          'id': '4ztnd2IahPRr3wk9FPwiGV',
          'title': 'San Cisco - On The Line',
        },
        {
          'id': '6RMvf7OCYYSw4x2K8UakDt',
          'title': 'E^ST - TALK DEEP',
        },
      ],
    };
    const update = {updateMessage: true};
    mockSettingsExtra.changeSkipAddVote.mockRejectedValue(error);
    mockSlackFormatReply.messageUpdate.mockReturnValue(update);

    await expect(mod.addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack)).rejects.toBe(error);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  describe('resolveSkip', () => {
    it('should fail to delete the Slack post and do nothing', async () => {
      const error = new Error();
      error.data = {error: 'message_not_found'};
      const auth = {auth: true};
      const statusTrack = {uri: status[0].item.uri, title: 'status track title'};
      const currentSkip = {
        'skip': {
          'track': {
            'duration': '3:48',
            'art': 'https://i.scdn.co/image/ab67616d00001e02334267c57b1e0d9d62239fde',
            'artists': 'Hermitude',
            'artistsIds': [
              '3fmMaLC5jjf2N4EC2kTx0u',
            ],
            'album': 'TheSoundYouNeed, Vol. 1',
            'name': 'Ukiyo',
            'id': '3nKx86fcs8MYMydill0Sya',
            'title': 'Hermitude - Ukiyo',
            'uri': 'spotify:track:3nKx86fcs8MYMydill0Sya',
            'url': 'https://open.spotify.com/track/3nKx86fcs8MYMydill0Sya',
          },
          'timestamp': '1597585709.000800',
        },
        'votes': {
          'users': [
            'URVUTD7UP2',
          ],
          'votesNeeded': 2,
        },
        'history': [
          {
            'id': '6jVy9OEtu7VJyPrrHG25jb',
            'title': 'Sam Allen - Barricade',
          },
          {
            'id': '34gCuhDGsG4bRPIf9bb02f',
            'title': 'Ed Sheeran - Thinking out Loud',
          },
          {
            'id': '579j0QRchEajNo11kaaAUx',
            'title': 'San Cisco - When I Dream',
          },
          {
            'id': '4ztnd2IahPRr3wk9FPwiGV',
            'title': 'San Cisco - On The Line',
          },
          {
            'id': '6RMvf7OCYYSw4x2K8UakDt',
            'title': 'E^ST - TALK DEEP',
          },
        ],
      };
      const deleteThis = {deleteThis: true};
      mockSlackFormatReply.deleteMessage.mockReturnValue(deleteThis);
      mockSlackApi.deleteChat.mockRejectedValue(error);
      mockSettingsExtra.changeSkipAddHistory.mockResolvedValue();

      await expect(mod.addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack)).resolves.toBe();
      expect(mockSlackFormatReply.deleteMessage).toHaveBeenCalledWith(channelId, currentSkip.skip.timestamp);
      expect(mockSlackApi.deleteChat).toHaveBeenCalledWith(deleteThis);
    });

    it('should fail to delete the Slack post and throw an error', async () => {
      const error = new Error();
      const auth = {auth: true};
      const statusTrack = {uri: status[0].item.uri, title: 'status track title'};
      const currentSkip = {
        'skip': {
          'track': {
            'duration': '3:48',
            'art': 'https://i.scdn.co/image/ab67616d00001e02334267c57b1e0d9d62239fde',
            'artists': 'Hermitude',
            'artistsIds': [
              '3fmMaLC5jjf2N4EC2kTx0u',
            ],
            'album': 'TheSoundYouNeed, Vol. 1',
            'name': 'Ukiyo',
            'id': '3nKx86fcs8MYMydill0Sya',
            'title': 'Hermitude - Ukiyo',
            'uri': 'spotify:track:3nKx86fcs8MYMydill0Sya',
            'url': 'https://open.spotify.com/track/3nKx86fcs8MYMydill0Sya',
          },
          'timestamp': '1597585709.000800',
        },
        'votes': {
          'users': [
            'URVUTD7UP2',
          ],
          'votesNeeded': 2,
        },
        'history': [
          {
            'id': '6jVy9OEtu7VJyPrrHG25jb',
            'title': 'Sam Allen - Barricade',
          },
          {
            'id': '34gCuhDGsG4bRPIf9bb02f',
            'title': 'Ed Sheeran - Thinking out Loud',
          },
          {
            'id': '579j0QRchEajNo11kaaAUx',
            'title': 'San Cisco - When I Dream',
          },
          {
            'id': '4ztnd2IahPRr3wk9FPwiGV',
            'title': 'San Cisco - On The Line',
          },
          {
            'id': '6RMvf7OCYYSw4x2K8UakDt',
            'title': 'E^ST - TALK DEEP',
          },
        ],
      };
      const deleteThis = {deleteThis: true};
      mockSlackFormatReply.deleteMessage.mockReturnValue(deleteThis);
      mockSlackApi.deleteChat.mockRejectedValue(error);
      mockSettingsExtra.changeSkipAddHistory.mockResolvedValue();

      await expect(mod.addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack)).rejects.toBe(error);
      expect(mockSlackFormatReply.deleteMessage).toHaveBeenCalledWith(channelId, currentSkip.skip.timestamp);
      expect(mockSlackApi.deleteChat).toHaveBeenCalledWith(deleteThis);
    });

    it('should add a vote to the skip and hit a race condition, to be resolved by slack', async () => {
      const error = new Error();
      error.code = 'ConditionalCheckFailedException';
      const auth = {auth: true};
      const statusTrack = {uri: status[0].item.uri, title: 'status track title'};
      const currentSkip = {
        'skip': {
          'track': {
            'duration': '3:48',
            'art': 'https://i.scdn.co/image/ab67616d00001e02334267c57b1e0d9d62239fde',
            'artists': 'Hermitude',
            'artistsIds': [
              '3fmMaLC5jjf2N4EC2kTx0u',
            ],
            'album': 'TheSoundYouNeed, Vol. 1',
            'name': 'Ukiyo',
            'id': '3nKx86fcs8MYMydill0Sya',
            'title': 'Hermitude - Ukiyo',
            'uri': 'spotify:track:3nKx86fcs8MYMydill0Sya',
            'url': 'https://open.spotify.com/track/3nKx86fcs8MYMydill0Sya',
          },
          'timestamp': '1597585709.000800',
        },
        'votes': {
          'users': [
            'URVUTD7UP2',
          ],
          'votesNeeded': 3,
        },
        'history': [
          {
            'id': '6jVy9OEtu7VJyPrrHG25jb',
            'title': 'Sam Allen - Barricade',
          },
          {
            'id': '34gCuhDGsG4bRPIf9bb02f',
            'title': 'Ed Sheeran - Thinking out Loud',
          },
          {
            'id': '579j0QRchEajNo11kaaAUx',
            'title': 'San Cisco - When I Dream',
          },
          {
            'id': '4ztnd2IahPRr3wk9FPwiGV',
            'title': 'San Cisco - On The Line',
          },
          {
            'id': '6RMvf7OCYYSw4x2K8UakDt',
            'title': 'E^ST - TALK DEEP',
          },
        ],
      };
      const currentSkip2 = {
        'skip': {
          'track': {
            'duration': '3:48',
            'art': 'https://i.scdn.co/image/ab67616d00001e02334267c57b1e0d9d62239fde',
            'artists': 'Hermitude',
            'artistsIds': [
              '3fmMaLC5jjf2N4EC2kTx0u',
            ],
            'album': 'TheSoundYouNeed, Vol. 1',
            'name': 'Ukiyo',
            'id': '3nKx86fcs8MYMydill0Sya',
            'title': 'Hermitude - Ukiyo',
            'uri': 'spotify:track:3nKx86fcs8MYMydill0Sya',
            'url': 'https://open.spotify.com/track/3nKx86fcs8MYMydill0Sya',
          },
          'timestamp': '1597585709.000800',
        },
        'votes': {
          'users': [
            'URVUTD7UP2',
            'USER2',
            'USER3',
          ],
          'votesNeeded': 3,
        },
        'history': [
          {
            'id': '6jVy9OEtu7VJyPrrHG25jb',
            'title': 'Sam Allen - Barricade',
          },
          {
            'id': '34gCuhDGsG4bRPIf9bb02f',
            'title': 'Ed Sheeran - Thinking out Loud',
          },
          {
            'id': '579j0QRchEajNo11kaaAUx',
            'title': 'San Cisco - When I Dream',
          },
          {
            'id': '4ztnd2IahPRr3wk9FPwiGV',
            'title': 'San Cisco - On The Line',
          },
          {
            'id': '6RMvf7OCYYSw4x2K8UakDt',
            'title': 'E^ST - TALK DEEP',
          },
        ],
      };
      const update = {updateMessage: true};
      mockSettingsExtra.changeSkipAddVote.mockRejectedValue(error);
      mockSlackFormatReply.messageUpdate.mockReturnValue(update);
      mockSlackApi.deleteChat.mockResolvedValue();
      mockSettingsExtra.loadSkip.mockResolvedValue(currentSkip2);
      mockSettingsExtra.changeSkipAddHistory.mockResolvedValue();
      const deleteThis = {deleteThis: true};
      mockSlackFormatReply.deleteMessage.mockReturnValue(deleteThis);
      mockSlackApi.deleteChat.mockResolvedValue();
      mockSettingsExtra.changeSkipAddHistory.mockResolvedValue();

      await expect(mod.addVote(teamId, channelId, auth, settings, userId, currentSkip, statusTrack)).resolves.toBe();
      expect(mockSlackFormatReply.deleteMessage).toHaveBeenCalledWith(channelId, currentSkip.skip.timestamp);
      expect(mockSlackApi.deleteChat).toHaveBeenCalledWith(deleteThis);
      expect(mockSlackFormatReply.inChannelPost).toHaveBeenCalledWith(channelId, response.confirmation(statusTrack.title, currentSkip2.votes.users), null);
    });
  });
});
