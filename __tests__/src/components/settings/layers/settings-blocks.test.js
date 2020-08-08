/* eslint-disable require-jsdoc */
const mockConfig = {
  'dynamodb': {
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
  'settings': {
    'limits': {
      'disable_repeats_duration': 5,
      'skip_votes': 2,
    },
    'query_lengths': {
      'default_device': 0,
      'playlist': 3,
      'timezone': 3,
    },
  },
};

// Mock Modules
const mockMoment = {
  tz: jest.fn().mockReturnThis(),
  format: jest.fn(),
  add: jest.fn(),
  unix: jest.fn(),
  names: jest.fn(),
};

const mockSlackFormatModal = {
  buttonSection: jest.fn(),
  multiSelectUsers: jest.fn(),
  option: jest.fn(),
  selectExternal: jest.fn(),
  selectStatic: jest.fn(),
  textInput: jest.fn(),
  yesOrNo: jest.fn(),
};

jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => {
  const mock = () => mockMoment;
  mock.tz = mockMoment;
  return mock;
}, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackFormatModal, {virtual: true});

const mod = require('../../../../../src/components/settings/layers/settings-blocks');
const labels = mod.LABELS;
const hints = mod.HINTS;
const place = mod.PLACE;
const {settings} = require('../../../../data/request');

describe('Settings Block', () => {
  describe('getSettings block', () => {
    it('should get a settings block with no existing settings', async () => {
      const multiUsers = {multi: true};
      const button = {button: true};
      const option = {option: true};
      const selectExternal = {selectExt: true};
      const selectStatic = {selectStat: true};
      const textInput = {text: true};
      const yesOrNo = {yes: true};

      mockSlackFormatModal.multiSelectUsers.mockReturnValue(multiUsers);
      mockSlackFormatModal.buttonSection.mockReturnValue(button);
      mockSlackFormatModal.option.mockReturnValue(option);
      mockSlackFormatModal.selectExternal.mockReturnValue(selectExternal);
      mockSlackFormatModal.selectStatic.mockReturnValue(selectStatic);
      mockSlackFormatModal.selectExternal.mockReturnValue(selectExternal);
      mockSlackFormatModal.textInput.mockReturnValue(textInput);
      mockSlackFormatModal.yesOrNo.mockReturnValue(yesOrNo);

      expect.assertions(10);
      expect(mod.getSettingsBlocks(null)).toStrictEqual([multiUsers, selectExternal, selectExternal, textInput, selectStatic, selectStatic, selectExternal, textInput, textInput]);
      expect(mockSlackFormatModal.multiSelectUsers).toBeCalledWith(mockConfig.dynamodb.settings.channel_admins, labels.channel_admins, hints.channel_admins, null);
      expect(mockSlackFormatModal.selectExternal).toBeCalledWith(mockConfig.dynamodb.settings.playlist, labels.playlist, hints.playlist, null, mockConfig.settings.query_lengths.playlist, place.playlist);
      expect(mockSlackFormatModal.selectExternal).toBeCalledWith(mockConfig.dynamodb.settings.default_device, labels.default_device, hints.default_device, null, mockConfig.settings.query_lengths.default_device, place.default_device);
      expect(mockSlackFormatModal.textInput).toBeCalledWith(mockConfig.dynamodb.settings.disable_repeats_duration, labels.disable_repeats_duration, hints.disable_repeats_duration, null, mockConfig.settings.limits.disable_repeats_duration, place.disable_repeats_duration);
      expect(mockSlackFormatModal.selectStatic).toBeCalledWith(mockConfig.dynamodb.settings.back_to_playlist, labels.back_to_playlist, hints.back_to_playlist, null, yesOrNo);
      expect(mockSlackFormatModal.selectStatic).toBeCalledWith(mockConfig.dynamodb.settings.ghost_mode, labels.ghost_mode, hints.ghost_mode, null, yesOrNo);
      expect(mockSlackFormatModal.selectExternal).toBeCalledWith(mockConfig.dynamodb.settings.timezone, labels.timezone, hints.timezone, null, mockConfig.settings.query_lengths.timezone, place.timezone);
      expect(mockSlackFormatModal.textInput).toBeCalledWith(mockConfig.dynamodb.settings.skip_votes, labels.skip_votes, hints.skip_votes, null, mockConfig.settings.limits.skip_votes, place.skip_votes);
      expect(mockSlackFormatModal.textInput).toBeCalledWith(mockConfig.dynamodb.settings.skip_votes_ah, labels.skip_votes_ah, hints.skip_votes_ah, null, mockConfig.settings.limits.skip_votes, place.skip_votes_ah);
    });

    it('should get a settings block with existing settings', async () => {
      const multiUsers = {multi: true};
      const button = {button: true};
      const option = {option: true};
      const selectExternal = {selectExt: true};
      const selectStatic = {selectStat: true};
      const textInput = {text: true};
      const yesOrNo = {yes: true};
      const momentFormat = '+10.00';

      mockSlackFormatModal.multiSelectUsers.mockReturnValue(multiUsers);
      mockSlackFormatModal.buttonSection.mockReturnValue(button);
      mockSlackFormatModal.option.mockReturnValue(option);
      mockSlackFormatModal.selectExternal.mockReturnValue(selectExternal);
      mockSlackFormatModal.selectStatic.mockReturnValue(selectStatic);
      mockSlackFormatModal.selectExternal.mockReturnValue(selectExternal);
      mockSlackFormatModal.textInput.mockReturnValue(textInput);
      mockSlackFormatModal.yesOrNo.mockReturnValue(yesOrNo);
      mockMoment.tz.mockReturnThis();
      mockMoment.format.mockReturnValue(momentFormat);

      expect.assertions(16);
      expect(mod.getSettingsBlocks(settings)).toStrictEqual([multiUsers, selectExternal, selectExternal, textInput, selectStatic, selectStatic, selectExternal, textInput, textInput]);
      expect(mockSlackFormatModal.multiSelectUsers).toBeCalledWith(mockConfig.dynamodb.settings.channel_admins, labels.channel_admins, hints.channel_admins, settings.channel_admins);
      expect(mockSlackFormatModal.selectExternal).toBeCalledWith(mockConfig.dynamodb.settings.playlist, labels.playlist, hints.playlist, option, mockConfig.settings.query_lengths.playlist, place.playlist);
      expect(mockSlackFormatModal.option).nthCalledWith(1, settings.playlist.name, settings.playlist.id);
      expect(mockSlackFormatModal.selectExternal).toBeCalledWith(mockConfig.dynamodb.settings.default_device, labels.default_device, hints.default_device, option, mockConfig.settings.query_lengths.default_device, place.default_device);
      expect(mockSlackFormatModal.option).nthCalledWith(2, settings.default_device.name, settings.default_device.id);
      expect(mockSlackFormatModal.textInput).toBeCalledWith(mockConfig.dynamodb.settings.disable_repeats_duration, labels.disable_repeats_duration, hints.disable_repeats_duration, settings.disable_repeats_duration, mockConfig.settings.limits.disable_repeats_duration, place.disable_repeats_duration);
      expect(mockSlackFormatModal.selectStatic).toBeCalledWith(mockConfig.dynamodb.settings.back_to_playlist, labels.back_to_playlist, hints.back_to_playlist, option, yesOrNo);
      expect(mockSlackFormatModal.option).nthCalledWith(3, 'No', 'false');
      expect(mockSlackFormatModal.selectStatic).toBeCalledWith(mockConfig.dynamodb.settings.ghost_mode, labels.ghost_mode, hints.ghost_mode, option, yesOrNo);
      expect(mockSlackFormatModal.option).nthCalledWith(4, 'Yes', 'true');
      expect(mockSlackFormatModal.selectExternal).toBeCalledWith(mockConfig.dynamodb.settings.timezone, labels.timezone, hints.timezone, option, mockConfig.settings.query_lengths.timezone, place.timezone);
      expect(mockMoment.tz).toBeCalledWith(settings.timezone);
      expect(mockSlackFormatModal.option).nthCalledWith(5, `${settings.timezone} (${momentFormat})`, settings.timezone);
      expect(mockSlackFormatModal.textInput).toBeCalledWith(mockConfig.dynamodb.settings.skip_votes, labels.skip_votes, hints.skip_votes, settings.skip_votes, mockConfig.settings.limits.skip_votes, place.skip_votes);
      expect(mockSlackFormatModal.textInput).toBeCalledWith(mockConfig.dynamodb.settings.skip_votes_ah, labels.skip_votes_ah, hints.skip_votes_ah, settings.skip_votes_ah, mockConfig.settings.limits.skip_votes, place.skip_votes_ah);
    });
  });
});
