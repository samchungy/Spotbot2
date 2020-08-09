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
const {teamId, channelId, settings} = require('../../../../data/request');
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
const errors = {
  admin_error: (users) => `:information_source: You must be a Spotbot admin for this channel to use this command. Current channel admins: ${users.map((user)=>`<@${user}>`).join(', ')}.`,
  setup_error: ':information_source: Spotbot is not installed in this channel. Please run `/invite @spotbot` and try again.',
  settings_error: ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.',
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
});
