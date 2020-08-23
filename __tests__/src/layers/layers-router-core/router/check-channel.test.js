const mockErrorsSettings = {
  SetupError: jest.fn(),
};

const mockSlackApi = {
  getConversationInfo: jest.fn(),
};

jest.mock('/opt/errors/errors-settings', () => mockErrorsSettings, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});

const mod = require('../../../../../src/layers/layers-router-core/router/check-channel');
const errors = mod.ERROR_MESSAGES;
const {channelId} = require('../../../../data/request');
describe('Check Settings', () => {
  it('checkIsInChannel should return true', async () => {
    const conversationInfo = {
      'ok': true,
      'channel': {
        'id': 'C012AB3CD',
        'name': 'general',
        'is_channel': true,
        'is_group': false,
        'is_im': false,
        'created': 1449252889,
        'creator': 'W012A3BCD',
        'is_archived': false,
        'is_general': true,
        'unlinked': 0,
        'name_normalized': 'general',
        'is_read_only': false,
        'is_shared': false,
        'parent_conversation': null,
        'is_ext_shared': false,
        'is_org_shared': false,
        'pending_shared': [],
        'is_pending_ext_shared': false,
        'is_member': true,
        'is_private': false,
        'is_mpim': false,
        'last_read': '1502126650.228446',
        'topic': {
          'value': 'For public discussion of generalities',
          'creator': 'W012A3BCD',
          'last_set': 1449709364,
        },
        'purpose': {
          'value': 'This part of the workspace is for fun. Make fun here.',
          'creator': 'W012A3BCD',
          'last_set': 1449709364,
        },
        'previous_names': [
          'specifics',
          'abstractions',
          'etc',
        ],
        'locale': 'en-US',
      },
    };
    mockSlackApi.getConversationInfo.mockResolvedValue(conversationInfo);
    await expect(mod.checkIsInChannel(channelId)).resolves.toBe(true);
    expect(mockSlackApi.getConversationInfo).toHaveBeenCalledWith(channelId);
  });

  it('checkIsInChannel should return channel error', async () => {
    const conversationInfo = {
      'ok': true,
      'channel': {
        'id': 'C012AB3CD',
        'name': 'general',
        'is_channel': true,
        'is_group': false,
        'is_im': false,
        'created': 1449252889,
        'creator': 'W012A3BCD',
        'is_archived': false,
        'is_general': true,
        'unlinked': 0,
        'name_normalized': 'general',
        'is_read_only': false,
        'is_shared': false,
        'parent_conversation': null,
        'is_ext_shared': false,
        'is_org_shared': false,
        'pending_shared': [],
        'is_pending_ext_shared': false,
        'is_member': false,
        'is_private': false,
        'is_mpim': false,
        'last_read': '1502126650.228446',
        'topic': {
          'value': 'For public discussion of generalities',
          'creator': 'W012A3BCD',
          'last_set': 1449709364,
        },
        'purpose': {
          'value': 'This part of the workspace is for fun. Make fun here.',
          'creator': 'W012A3BCD',
          'last_set': 1449709364,
        },
        'previous_names': [
          'specifics',
          'abstractions',
          'etc',
        ],
        'locale': 'en-US',
      },
    };
    mockSlackApi.getConversationInfo.mockResolvedValue(conversationInfo);
    await expect(mod.checkIsInChannel(channelId)).rejects.toStrictEqual(expect.any(mockErrorsSettings.SetupError));
    expect(mockSlackApi.getConversationInfo).toHaveBeenCalledWith(channelId);
    expect(mockErrorsSettings.SetupError).toHaveBeenCalledWith(errors.setup_error);
  });
});
