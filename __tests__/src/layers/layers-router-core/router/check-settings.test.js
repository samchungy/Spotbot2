const mockConfig = {
  dynamodb: {
    'settings': {
      'channel_admins': 'channel_admins',
      'playlist': 'playlist',
      'default_device': 'default_device',
      'disable_repeats_duration': 'disable_repeats_duration',
      'back_to_playlist': 'back_to_playlist',
      'skip_votes': 'skip_votes',
      'skip_votes_ah': 'skip_votes_ah',
      'timezone': 'timezone',
      'ghost_mode': 'ghost_mode',
    },
  },
};

const mockSettingsInterface = {
  loadSettings: jest.fn(),
};

const mockErrorsSettings = {
  ChannelAdminError: jest.fn(),
  SettingsError: jest.fn(),
  SetupError: jest.fn(),
};

const mockSlackApi = {
  getConversationInfo: jest.fn(),
};

jest.mock('/opt/config/config', () => mockConfig, {virtual: true});

jest.mock('/opt/db/settings-interface', () => mockSettingsInterface, {virtual: true});

jest.mock('/opt/errors/errors-settings', () => mockErrorsSettings, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});

const mod = require('../../../../../src/layers/layers-router-core/router/check-settings');
const errors = mod.ERROR_MESSAGES;
const {teamId, channelId, settings, userId} = require('../../../../data/request');
const deactivatedSettings = {
  'default_device': null,
  'playlist': null,
  'skip_votes': '0',
  'timezone': 'Australia/Melbourne',
  'skip_votes_ah': '0',
  'channel_admins': [
    'URVUTD7UP',
  ],
  'ghost_mode': 'true',
  'back_to_playlist': 'false',
  'disable_repeats_duration': '0',
};

describe('Check Settings', () => {
  it('checkIsSetup should return back settings', async () => {
    await expect(mod.checkIsSetup(teamId, channelId, settings)).resolves.toBe(settings);
  });

  it('checkIsSetup should load settings and return settings', async () => {
    mockSettingsInterface.loadSettings.mockResolvedValue(settings);
    await expect(mod.checkIsSetup(teamId, channelId, undefined)).resolves.toBe(settings);
    expect(mockSettingsInterface.loadSettings).toBeCalledWith(teamId, channelId);
  });

  it('checkIsSetup should reject with SettingsError when settings equals null', async () => {
    const error = new mockErrorsSettings.SettingsError(errors.settings_error);
    mockSettingsInterface.loadSettings.mockResolvedValue(null);
    await expect(mod.checkIsSetup(teamId, channelId, undefined)).rejects.toStrictEqual(error);
    expect(mockSettingsInterface.loadSettings).toBeCalledWith(teamId, channelId);
  });

  it('checkIsSetup should reject with SettingsError when settings are deactivated', async () => {
    const error = new mockErrorsSettings.SettingsError(errors.settings_error);
    mockSettingsInterface.loadSettings.mockResolvedValue(deactivatedSettings);
    await expect(mod.checkIsSetup(teamId, channelId, undefined)).rejects.toStrictEqual(error);
    expect(mockSettingsInterface.loadSettings).toBeCalledWith(teamId, channelId);
  });

  it('checkIsPreviouslySetup should return back settings', async () => {
    mockSettingsInterface.loadSettings.mockResolvedValue(settings);
    await expect(mod.checkIsPreviouslySetup(teamId, channelId)).resolves.toBe(settings);
  });

  it('checkIsPreviouslySetup should return setupError', async () => {
    mockSettingsInterface.loadSettings.mockResolvedValue(null);
    await expect(mod.checkIsPreviouslySetup(teamId, channelId)).rejects.toStrictEqual(expect.any(mockErrorsSettings.SetupError));
    expect(mockErrorsSettings.SetupError).toHaveBeenCalledWith(errors.setup_error);
  });

  it('checkIsAdmin should return true', async () => {
    await expect(mod.checkIsAdmin(settings, userId)).resolves.toBe(true);
  });

  it('checkIsAdmin should return be rejected with admin error', async () => {
    await expect(mod.checkIsAdmin(settings, 'bad id')).rejects.toStrictEqual(expect.any(mockErrorsSettings.ChannelAdminError));
  });

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
