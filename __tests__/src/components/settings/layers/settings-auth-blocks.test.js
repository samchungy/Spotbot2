/* eslint-disable require-jsdoc */
const mockConfig = {
  'spotify_api': {
    'scopes': [
      'user-read-private',
      'user-read-email',
      'user-read-recently-played',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-collaborative',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
      'streaming',
    ],
  },
  'dynamodb': {
    'settings_auth': {
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

const mockSpotifyAuth = {
  fetchAuthUrl: jest.fn(),
};
const mockSpotifyProfile = {
  fetchProfile: jest.fn(),
};
const mockAuthInterface = {
  storeState: jest.fn(),
  modelState: jest.fn(),
};
const mockAuthSession = {
  authSession: jest.fn(),
};

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}
class PremiumError extends AuthError {
  constructor(message) {
    super(message);
    this.name = 'PremiumError';
  }
}

const mockAuthErrors = {
  AuthError,
  PremiumError,
};

const mockSlackFormatModal = {
  buttonSection: jest.fn(),
};
const mockSlackFormatBlocks = {
  contextSection: jest.fn(),
  confirmObject: jest.fn(),
};
const mockUtilTransform = {
  encode64: jest.fn(),
  decode64: jest.fn(),
};

jest.mock('/opt/nodejs/moment-timezone/moment-timezone-with-data-1970-2030', () => mockMom, {virtual: true});
jest.mock('/opt/config/config', () => mockConfig, {virtual: true});
jest.mock('/opt/utils/util-logger', () => mockLogger, {virtual: true});

jest.mock('/opt/spotify/spotify-api-v2/spotify-api-auth', () => mockSpotifyAuth, {virtual: true});
jest.mock('/opt/spotify/spotify-api-v2/spotify-api-profile', () => mockSpotifyProfile, {virtual: true});
jest.mock('/opt/db/spotify-auth-interface', () => mockAuthInterface, {virtual: true});
jest.mock('/opt/spotify/spotify-auth/spotify-auth-session', () => mockAuthSession, {virtual: true});
jest.mock('/opt/errors/errors-spotify', () => mockAuthErrors, {virtual: true});

jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackFormatModal, {virtual: true});
jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackFormatBlocks, {virtual: true});
jest.mock('/opt/utils/util-transform', () => mockUtilTransform, {virtual: true});

const mod = require('../../../../../src/components/settings/layers/settings-auth-blocks');
const response = mod.RESPONSE;
const labels = mod.LABELS;
const hints = mod.HINTS;

const profile = require('../../../../data/spotify/profile');
const {teamId, channelId, viewId, url} = require('../../../../data/request');


describe('Settings Auth Block', () => {
  beforeEach(() => {
    mockMom.mockImplementation(() => mockMoment);
  });
  describe('getAuthBlock', () => {
    it('should get an authenticated settings block', async () => {
      const auth = {auth: true, getAccess: async () => Promise.resolve('accessToken')};
      const confirm = {'confirm': true};
      const context = {'context': true};
      const button = {'button': true};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyProfile.fetchProfile.mockResolvedValue(profile[0]);
      mockSlackFormatBlocks.confirmObject.mockReturnValue(confirm);
      mockSlackFormatBlocks.contextSection.mockReturnValue(context);
      mockSlackFormatModal.buttonSection.mockReturnValue(button);

      expect.assertions(6);
      await expect(mod.getAuthBlock(teamId, channelId, viewId, url)).resolves.toStrictEqual({authBlock: [button, context], authError: false});
      expect(mockAuthSession.authSession).toBeCalledWith(teamId, channelId);
      expect(mockSpotifyProfile.fetchProfile).toBeCalledWith(auth);
      expect(mockSlackFormatBlocks.confirmObject).toBeCalledWith(labels.reauth_confirm, hints.reauth_confirm, 'Reset Authentication', 'Cancel');
      expect(mockSlackFormatModal.buttonSection).toBeCalledWith(mockConfig.dynamodb.settings_auth.reauth, labels.reauth, hints.reauth_url_button, null, null, mockConfig.dynamodb.settings_auth.reauth, confirm);
      expect(mockSlackFormatBlocks.contextSection).toBeCalledWith(mockConfig.dynamodb.settings_auth.auth_confirmation, response.auth_statement(profile[0].display_name));
    });

    it('should get an authenticated settings block - no Spotify display name', async () => {
      const auth = {auth: true, getAccess: async () => Promise.resolve('accessToken')};
      const confirm = {'confirm': true};
      const context = {'context': true};
      const button = {'button': true};
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyProfile.fetchProfile.mockResolvedValue(profile[1]);
      mockSlackFormatBlocks.confirmObject.mockReturnValue(confirm);
      mockSlackFormatBlocks.contextSection.mockReturnValue(context);
      mockSlackFormatModal.buttonSection.mockReturnValue(button);

      expect.assertions(6);
      await expect(mod.getAuthBlock(teamId, channelId, viewId, url)).resolves.toStrictEqual({authBlock: [button, context], authError: false});
      expect(mockAuthSession.authSession).toBeCalledWith(teamId, channelId);
      expect(mockSpotifyProfile.fetchProfile).toBeCalledWith(auth);
      expect(mockSlackFormatBlocks.confirmObject).toBeCalledWith(labels.reauth_confirm, hints.reauth_confirm, 'Reset Authentication', 'Cancel');
      expect(mockSlackFormatModal.buttonSection).toBeCalledWith(mockConfig.dynamodb.settings_auth.reauth, labels.reauth, hints.reauth_url_button, null, null, mockConfig.dynamodb.settings_auth.reauth, confirm);
      expect(mockSlackFormatBlocks.contextSection).toBeCalledWith(mockConfig.dynamodb.settings_auth.auth_confirmation, response.auth_statement(profile[1].id));
    });

    it('should get an non-authenticated settings block - get access returns null', async () => {
      const auth = {auth: true, getAccess: async () => Promise.resolve(null)};
      const authenticationUrl = 'auth-url';
      const encoded = 'encoded';
      const unixTime = '123456';
      const state = {teamId: 'teamId', channelId: 'channel', state: 'state'};
      const button = {'button': true};

      mockAuthInterface.modelState.mockReturnValue(state);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockAuthInterface.storeState.mockResolvedValue();
      mockSpotifyAuth.fetchAuthUrl.mockResolvedValue(authenticationUrl);
      mockUtilTransform.encode64.mockReturnValue(encoded);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(unixTime);
      mockSlackFormatModal.buttonSection.mockReturnValue(button);

      await expect(mod.getAuthBlock(teamId, channelId, viewId, url)).resolves.toStrictEqual({authBlock: [button], authError: true});
      expect(mockAuthInterface.storeState).toBeCalledWith(teamId, channelId, {state}, unixTime);
      expect(mockSpotifyAuth.fetchAuthUrl).toBeCalledWith(mockConfig.spotify_api.scopes, `${url}/${mockConfig.dynamodb.settings_auth.auth_url}`, encodeURIComponent(encoded));
      expect(mockSlackFormatModal.buttonSection).toBeCalledWith(mockConfig.dynamodb.settings_auth.auth_url, labels.auth_url, hints.auth_url_button, null, authenticationUrl, null);
    });

    it('should get an non-authenticated settings block - get access throws an AuthError', async () => {
      const authError = new AuthError();
      const auth = {auth: true, getAccess: async () => Promise.reject(authError)};
      const authenticationUrl = 'auth-url';
      const encoded = 'encoded';
      const unixTime = '123456';
      const state = {teamId: 'teamId', channelId: 'channel', state: 'state'};
      const button = {'button': true};

      mockAuthInterface.modelState.mockReturnValue(state);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockAuthInterface.storeState.mockResolvedValue();
      mockSpotifyAuth.fetchAuthUrl.mockResolvedValue(authenticationUrl);
      mockUtilTransform.encode64.mockReturnValue(encoded);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(unixTime);
      mockSlackFormatModal.buttonSection.mockReturnValue(button);

      await expect(mod.getAuthBlock(teamId, channelId, viewId, url)).resolves.toStrictEqual({authBlock: [button], authError: true});
      expect(mockAuthInterface.storeState).toBeCalledWith(teamId, channelId, {state}, unixTime);
      expect(mockSpotifyAuth.fetchAuthUrl).toBeCalledWith(mockConfig.spotify_api.scopes, `${url}/${mockConfig.dynamodb.settings_auth.auth_url}`, encodeURIComponent(encoded));
      expect(mockSlackFormatModal.buttonSection).toBeCalledWith(mockConfig.dynamodb.settings_auth.auth_url, labels.auth_url, hints.auth_url_button, null, authenticationUrl, null);
    });

    it('should get an non-authenticated settings block - profile not premium', async () => {
      const auth = {auth: true, getAccess: async () => Promise.resolve('accessToken')};
      const authenticationUrl = 'auth-url';
      const encoded = 'encoded';
      const unixTime = '123456';
      const state = {teamId: 'teamId', channelId: 'channel', state: 'state'};
      const button = {'button': true};
      const context = {'context': true};

      mockAuthInterface.modelState.mockReturnValue(state);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockSpotifyProfile.fetchProfile.mockResolvedValue(profile[2]);
      mockAuthInterface.storeState.mockResolvedValue();
      mockSpotifyAuth.fetchAuthUrl.mockResolvedValue(authenticationUrl);
      mockUtilTransform.encode64.mockReturnValue(encoded);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(unixTime);
      mockSlackFormatModal.buttonSection.mockReturnValue(button);
      mockSlackFormatBlocks.contextSection.mockReturnValue(context);

      await expect(mod.getAuthBlock(teamId, channelId, viewId, url)).resolves.toStrictEqual({authBlock: [button, context], authError: true});
      expect(mockAuthInterface.storeState).toBeCalledWith(teamId, channelId, {state}, unixTime);
      expect(mockSpotifyAuth.fetchAuthUrl).toBeCalledWith(mockConfig.spotify_api.scopes, `${url}/${mockConfig.dynamodb.settings_auth.auth_url}`, encodeURIComponent(encoded));
      expect(mockSlackFormatModal.buttonSection).toBeCalledWith(mockConfig.dynamodb.settings_auth.auth_url, labels.auth_url, hints.auth_url_button, null, authenticationUrl, null);
      expect(mockSlackFormatBlocks.contextSection).toBeCalledWith(mockConfig.dynamodb.settings_auth.auth_error, response.premium_error);
    });

    it('should throw an error when getAccess fails', async () => {
      const error = new Error();
      const auth = {auth: true, getAccess: async () => Promise.reject(error)};
      const authenticationUrl = 'auth-url';
      const encoded = 'encoded';
      const unixTime = '123456';
      const state = {teamId: 'teamId', channelId: 'channel', state: 'state'};

      mockAuthInterface.modelState.mockReturnValue(state);
      mockAuthSession.authSession.mockResolvedValue(auth);
      mockAuthInterface.storeState.mockResolvedValue();
      mockSpotifyAuth.fetchAuthUrl.mockResolvedValue(authenticationUrl);
      mockUtilTransform.encode64.mockReturnValue(encoded);
      mockMoment.add.mockReturnThis();
      mockMoment.unix.mockReturnValue(unixTime);

      await expect(mod.getAuthBlock(teamId, channelId, viewId, url)).rejects.toBe(error);
      expect(mockLogger.error).toBeCalledWith(error, 'Failed to generate AuthBlock');
    });
  });
});
