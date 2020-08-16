const mockSlackErrorReporter = {
  reportErrorToSlack: jest.fn(),
};

const mockMoment = {
  tz: jest.fn(),
  format: jest.fn(),
  names: jest.fn(),
};
const mockMom = jest.fn(() => mockMoment);
mockMom.tz = mockMoment;

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

const mockSlackFormat = {
  option: jest.fn(),
  optionGroup: jest.fn(),
};

// Mock Declarations
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});
jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});
jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackFormat, {virtual: true});
jest.mock('/opt/slack/slack-error-reporter', () => mockSlackErrorReporter, {virtual: true});


// Main
const mod = require('../../../../src/components/settings/settings-get-options-timezones');
const response = mod.RESPONSE;
const option = mod.OPTION;
const {teamId, channelId, userId} = require('../../../data/request');
const query = {
  0: 'melbourne',
  1: 'Australia',
};
const params = {
  0: {teamId, channelId, userId, query: query[0]},
  1: {teamId, channelId, userId, query: query[1]},
};
const momentData = {
  0: [
    'Australia/ACT',
    'Australia/Adelaide',
    'Australia/Brisbane',
    'Australia/Broken_Hill',
    'Australia/Canberra',
    'Australia/Currie',
    'Australia/Darwin',
    'Australia/Eucla',
    'Australia/Hobart',
    'Australia/LHI',
    'Australia/Lindeman',
    'Australia/Lord_Howe',
    'Australia/Melbourne',
    'Australia/NSW',
    'Australia/North',
    'Australia/Perth',
    'Australia/Queensland',
    'Australia/South',
    'Australia/Sydney',
    'Australia/Tasmania',
    'Australia/Victoria',
    'Australia/West',
    'Australia/Yancowinna',
  ],
};


describe('Get Timezone Options', () => {
  describe('handler', () => {
    const event = params[0];
    describe('success', () => {
      it('should call the main function', async () => {
        expect.assertions(1);
        await expect(mod.handler(event)).resolves.toBe();
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mockMoment.tz.mockRejectedValue(error);

        expect.assertions(3);
        await expect(mod.handler(event)).resolves.toBe();
        expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), response.failed);
        expect(mockSlackErrorReporter.reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should return Slack options containing 1 timezone result', async () => {
      const event = params[0];
      const opt = {option: true};
      const optionGroup = {optionGroup: true};
      const format = '+10:00';
      const matchTimezone = 'Australia/Melbourne';

      mockSlackFormat.option.mockReturnValue(opt);
      mockSlackFormat.optionGroup.mockReturnValue(optionGroup);
      mockMoment.tz.mockReturnThis();
      mockMoment.names.mockReturnValue(momentData[0]);
      mockMoment.format.mockReturnValue(format);

      await expect(mod.handler(event)).resolves.toStrictEqual({option_groups: [optionGroup]});
      expect(mockMoment.names).toHaveBeenCalled();
      expect(mockMoment.tz).toHaveBeenCalled();
      expect(mockMoment.format).toHaveBeenCalled();
      expect(mockSlackFormat.option).toHaveBeenNthCalledWith(1, option.timezone(matchTimezone, format), matchTimezone);
      expect(mockSlackFormat.optionGroup).toHaveBeenCalledWith(option.results(1, query[0]), [opt]);
    });

    it('should return Slack options containing multiple timezone results', async () => {
      const event = params[1];
      const opt = {option: true};
      const optionGroup = {optionGroup: true};
      const format = '+10:00';

      mockSlackFormat.option.mockReturnValue(opt);
      mockSlackFormat.optionGroup.mockReturnValue(optionGroup);
      mockMoment.tz.mockReturnThis();
      mockMoment.names.mockReturnValue(momentData[0]);
      mockMoment.format.mockReturnValue(format);

      await mod.handler(event);
      expect(mockMoment.names).toHaveBeenCalled();
      expect(mockMoment.tz).toHaveBeenCalled();
      expect(mockMoment.format).toHaveBeenCalled();
      expect(mockSlackFormat.option).toHaveBeenCalledTimes(momentData[0].length);
      expect(mockSlackFormat.optionGroup).toHaveBeenCalledWith(option.results(momentData[0].length, query[1]), momentData[0].map(() => opt));
    });


    it('should return Slack options containing over 100 timezone results', async () => {
      const bigMomentData = new Array(101).fill().map(() => momentData[0][Math.floor(Math.random() * momentData[0].length)]);
      const event = params[1];
      const opt = {option: true};
      const optionGroup = {optionGroup: true};
      const format = '+10:00';

      mockSlackFormat.option.mockReturnValue(opt);
      mockSlackFormat.optionGroup.mockReturnValue(optionGroup);
      mockMoment.tz.mockReturnThis();
      mockMoment.names.mockReturnValue(bigMomentData);
      mockMoment.format.mockReturnValue(format);

      await mod.handler(event);
      expect(mockMoment.names).toHaveBeenCalled();
      expect(mockMoment.tz).toHaveBeenCalled();
      expect(mockMoment.format).toHaveBeenCalled();
      expect(mockSlackFormat.option).toHaveBeenCalledTimes(bigMomentData.length);
      expect(mockSlackFormat.optionGroup).toHaveBeenCalledWith(option.resultsHundred(bigMomentData.length, query[1]), bigMomentData.map(() => opt).slice(0, 100));
    });
  });
});

