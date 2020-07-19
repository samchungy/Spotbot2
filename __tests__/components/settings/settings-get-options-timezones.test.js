// Mock Functions
const config = {
  dynamodb: {
    settings_helper: {
      no_devices: 'no_devices',
      no_devices_label: 'no_devices_label',
      create_new_playlist: 'create_new_playlist.',
    },
    settings: {
      default_device: 'default_device',
      playlist: 'playlist',
    },
  },
  spotify_api: {
    playlists: {
      limit: 100,
    },
  },
};

const logger = {
  info: jest.fn(),
  error: jest.fn(),
};
const moment = {
  add: jest.fn(),
  format: jest.fn(),
  unix: jest.fn(),
  names: jest.fn(),
  tz: jest.fn(),
};
const reportErrorToSlack = jest.fn();

// Mock Modules
const mockMoment = () => {
  const momentMock = jest.fn(() => ({
    tz: moment.tz,
    format: moment.format,
  }));
  momentMock.tz = {
    names: moment.names,
  };
  return momentMock;
};
const mockLogger = () => ({
  info: logger.info,
  error: logger.error,
});
const mockSlackFormat = () => ({
  option: jest.fn().mockImplementation((name, value) => ({text: name, value: value})),
  optionGroup: jest.fn().mockImplementation((name, value) => ({text: name, value: value})),
});
const mockSlackErrorReporter = () => ({
  reportErrorToSlack: reportErrorToSlack,
});

// Mock Declarations
jest.doMock('/opt/config/config', config, {virtual: true});
jest.doMock('/opt/utils/util-logger', mockLogger, {virtual: true});
jest.doMock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', mockMoment, {virtual: true});
jest.doMock('/opt/slack/format/slack-format-modal', mockSlackFormat, {virtual: true});
jest.doMock('/opt/slack/slack-error-reporter', mockSlackErrorReporter, {virtual: true});

const mod = require('../../../src/components/settings/settings-get-options-timezones');
const main = mod.__get__('main');
const response = mod.__get__('RESPONSE');
const {teamId, channelId, userId} = require('../../data/request');
const query = {
  0: 'melbourne',
  1: 'Australia',
};
const params = {teamId, channelId, userId, query};
const parameters = {
  0: [query[0]], // winter queru
  1: [query[1]], // no playlist query
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
    beforeAll(() => {
      expect.extend({
        toHaveLength(received, length) {
          const pass = Array.isArray(received) && received.length === length;
          if (pass) {
            return {
              message: () =>
                `expected ${received} not to have length ${length}`,
              pass: true,
            };
          } else {
            return {
              message: () =>
                `expected ${received} to be have length ${length}`,
              pass: false,
            };
          }
        },
      });
    });
    afterAll(() => {
      mod.__ResetDependency__('main');
    });
    const event = params;
    describe('success', () => {
      it('should call the main function', async () => {
        mod.__set__('main', () => Promise.resolve());

        expect.assertions(1);
        await expect(mod.handler(event)).resolves.toBe();
      });
    });
    describe('error', () => {
      it('should report the error to Slack', async () => {
        const error = new Error();
        mod.__set__('main', () => Promise.reject(error));

        expect.assertions(3);
        await expect(mod.handler(event)).resolves.toBe();
        expect(logger.error).toHaveBeenCalledWith(error, response.failed);
        expect(reportErrorToSlack).toHaveBeenCalledWith(teamId, channelId, userId, response.failed);
      });
    });
  });

  describe('main', () => {
    it('should return Slack options containing 1 timezone result', async () => {
      moment.names.mockReturnValue(momentData[0]);
      moment.tz.mockReturnThis();
      moment.format.mockReturnValue('+10:00');

      expect.assertions(1);
      await expect(main(...parameters[0])).resolves.toStrictEqual({'option_groups': [{'text': '1 query for "melbourne".', 'value': [{'text': 'Australia/Melbourne (+10:00)', 'value': 'Australia/Melbourne'}]}]});
    });

    it('should return Slack options containing multiple timezone results', async () => {
      moment.names.mockReturnValue(momentData[0]);
      moment.tz.mockReturnThis();
      moment.format.mockReturnValue('+10:00');
      expect.assertions(1);
      await expect(main(...parameters[1])).resolves.toEqual(
          {
            option_groups: expect.arrayContaining([
              expect.objectContaining({
                text: expect.stringContaining('queries'),
                value: expect.toHaveLength(momentData[0].length),
              }),
            ]),
          },
      );
    });


    it('should return Slack options containing over 100 timezone results', async () => {
      const bigMomentData = new Array(101).fill().map(() => momentData[0][Math.floor(Math.random() * momentData[0].length)]);
      moment.names.mockReturnValue(bigMomentData);
      moment.tz.mockReturnThis();
      moment.format.mockReturnValue('+10:00');
      expect.assertions(1);
      await expect(main(...parameters[1])).resolves.toEqual(
          {
            option_groups: expect.arrayContaining([
              expect.objectContaining({
                text: expect.stringContaining('101'),
                value: expect.toHaveLength(100),
              }),
            ]),
          },
      );
    });
  });
});

