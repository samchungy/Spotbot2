const mockConfig = {
  dynamodb: {
    settings_auth: {
      'reauth': 'reauth',
      'auth_verify': 'auth_verify',
      'auth_confirmation': 'auth_confirmation',
      'auth_error': 'auth_error',
      'auth_url': 'spotify-auth-callback',
    },
  },
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

// Mock Modules
const mockMoment = {
  tz: jest.fn().mockReturnThis(),
  format: jest.fn(),
  add: jest.fn(),
  unix: jest.fn(),
  names: jest.fn(),
};
const mockMom = jest.fn(() => mockMoment);
mockMom.tz = jest.fn(() => mockMoment);

const mockSns = {
  publish: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};

const mockSlackApi = {
  updateModal: jest.fn(),
};

const mockSettingsInterface = {
  loadSettings: jest.fn(),
};

const mockAuthSession = {
  authSession: jest.fn(),
};

const mockAuthInterface = {
  loadState: jest.fn(),
  storeAuth: jest.fn(),
  changeProfile: jest.fn(),
};

const mockSpotifyAuth = {
  fetchTokens: jest.fn(),
};

const mockSpotifyProfile = {
  fetchProfile: jest.fn(),
};

const mockUtilObjects = {
  isEqual: jest.fn(),
};

const mockUtilTransform = {
  decode64: jest.fn(),
  encode64: jest.fn(),
};

jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});
jest.mock('/opt/sns', () => mockSns, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});

jest.mock('/opt/db/settings-interface', () => mockSettingsInterface, {virtual: true});

jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/db/spotify-auth-interface', () => mockAuthInterface, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-auth', () => mockSpotifyAuth, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-profile', () => mockSpotifyProfile, {virtual: true});

jest.mock('/opt/utils/util-objects', () => mockUtilObjects, {virtual: true});
jest.mock('/opt/utils/util-transform', () => mockUtilTransform, {virtual: true});

const mod = require('../../../../src/components/settings/settings-auth-validate');
const response = mod.RESPONSE;

const code = 'AQBxQr5L0nIJO1GtxvLNG4PE3dDgiPWCJxKPfEzaH1DroMxOmJ55DKbzOqvH_56MKydFXymnwWfx2y7EM9yjGOLCVB-VbpipXldy_-DgVT22oGx8N8sYadhWV-4teKWPr8LqpotRVt6oUHUjJHMyfoYe--danVcfQyyrrwlLSE2-R8ILNxe62TSoLe8Mio42UxB8aso_KQ4Eq2l8rEqarwTutNqyq6aDubX39jzCjCFgQkCql06c27xR_52GtKzlLNQ1Oo8qxrWVHeuRP0DakxH_XBH9BRbaBUjU-CZuiyM_rimpIVEQlX5Lp-XBjWK9LjtdmBl9pf97gRpnR7KKkwKahuCQTKb8gT5z_0lq4bAjPvMTElgLoqHQ0IJEt55g8uno2q1Kb8Vm7PgidR90LlpPvOqEs6o6U96tgaEHRssEwEDbOhk8_1zQvmHwPF3EYXz-HTuW14hP7DStEs59k1EYqWYzbsqAUyEQZdOz2A25KlZvz7H6sIKoesh5Dwwj85g';
const state = 'eyJ0ZWFtSWQiOiJUUlZVVEQ3RE0iLCJjaGFubmVsSWQiOiJDUlUzSDRNRUMiLCJ2aWV3SWQiOiJWMDE3RFRBM01UUSJ9';
const url = 'https://31ec3279fbac.ngrok.io/local';
const profileData = require('../../../data/spotify/profile');
const {teamId, channelId} = require('../../../data/request');
const params = {
  0: {code, state, url},
  1: {code, state: 'bad state', url},
};

describe('Validate auth from Spotify callback', () => {
  describe('main', () => {
    const state = {
      'state': {
        'channelId': 'CRU3H4MEC',
        'teamId': 'TRVUTD7DM',
        'viewId': 'V017DTA3MTQ',
      },
    };

    const tokens = {
      'access_token': 'ACCESS',
      'token_type': 'Bearer',
      'scope': 'user-read-private user-read-email',
      'expires_in': 3600,
      'refresh_token': 'REFRESH',
    };

    const auth = {'auth': true};

    it('should validate state, get tokens, store the profile and call to update view', async () => {
      const event = params[0];

      mockUtilTransform.decode64.mockReturnValue(JSON.stringify(state.state));
      mockAuthInterface.loadState.mockResolvedValue(state);
      mockUtilObjects.isEqual.mockReturnValue(true);
      mockAuthSession.authSession.mockImplementation(() => auth);
      mockSpotifyAuth.fetchTokens.mockResolvedValue(tokens);
      mockSpotifyProfile.fetchProfile.mockResolvedValue(profileData[0]);
      mockAuthInterface.changeProfile.mockResolvedValue();
      mockAuthInterface.storeAuth.mockResolvedValue();
      mockSns.promise.mockResolvedValue();
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue('12345');

      expect.assertions(8);
      await expect(mod.handler(event)).resolves.toBe(null);
      expect(mockSpotifyAuth.fetchTokens).toBeCalledWith(code, `${url}/${mockConfig.dynamodb.settings_auth.auth_url}`);
      expect(mockAuthInterface.storeAuth).toBeCalledWith(teamId, channelId, tokens.access_token, tokens.refresh_token, '12345');
      expect(mockAuthSession.authSession).toBeCalledWith(teamId, channelId);
      expect(mockSpotifyProfile.fetchProfile).toBeCalledWith(auth);
      expect(mockAuthInterface.changeProfile).toBeCalledWith(teamId, channelId, profileData[0].id, profileData[0].country);
      expect(mockSns.promise).toBeCalled();
      expect(mockUtilObjects.isEqual).toBeCalledWith({'channelId': 'CRU3H4MEC', 'teamId': 'TRVUTD7DM', 'viewId': 'V017DTA3MTQ'}, {'channelId': 'CRU3H4MEC', 'teamId': 'TRVUTD7DM', 'viewId': 'V017DTA3MTQ'});
    });

    it('should fail to validate state', async () => {
      const event = params[0];
      mockUtilTransform.decode64.mockReturnValue(undefined);

      expect.assertions(2);
      await expect(mod.handler(event)).resolves.toEqual(response.failed);
      expect(mockLogger.error).toBeCalledWith(expect.objectContaining({message: 'Unexpected token u in JSON at position 0'}), 'Verify State failed');
    });

    it('should fail to equal state', async () => {
      const event = params[0];
      mockUtilTransform.decode64.mockReturnValue(JSON.stringify(state.state));
      mockAuthInterface.loadState.mockResolvedValue({'state': 'bad state'});
      mockUtilObjects.isEqual.mockReturnValue(false);
      expect.assertions(2);
      await expect(mod.handler(event)).resolves.toEqual(response.failed);
      expect(mockLogger.error).toBeCalledWith(expect.objectContaining({'message': 'State not equal'}), 'Verify State failed');
    });
  });
});
