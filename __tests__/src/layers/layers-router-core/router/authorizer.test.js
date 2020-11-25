const mockCrypto = {
  createHmac: jest.fn(),
  update: jest.fn(),
  digest: jest.fn(),
  timingSafeEqual: jest.fn(),
};
const mockDate = {
  now: jest.fn(),
};

jest.mock('crypto', () => mockCrypto, {virtual: true});
// eslint-disable-next-line no-global-assign
Date = mockDate;

const mod = require('../../../../../src/layers/layers-router-core/router/authorizer');
const secret = process.env.SLACK_SIGNING_SECRET;
const event = {
  0: {
    'body': 'token=GR0v8MoxmPNjtsD0rHn9NMIo&team_id=TRVUTD7DM&team_domain=spotbottest&channel_id=CRU3H4MEC&channel_name=general&user_id=URVUTD7UP&user_name=samchungy&command=%2Fdspotbot&text=settings&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTRVUTD7DM%2F1273433407174%2F96nQIMGR7zu5OZxAD2bH0n3o&trigger_id=1304004152144.879979449463.77bbc613de6ddf581ea50db35033ce1f',
    'headers': {
      'Host': 'bf233132df1c.ngrok.io',
      'User-Agent': 'Slackbot 1.0 (+https://api.slack.com/robots)',
      'Accept-Encoding': 'gzip,deflate',
      'Accept': 'application/json,*/*',
      'X-Slack-Signature': 'v0=2c3a7ce46fdd7c1cf35bbd4b92868d8dccf046d27efdc52598e73c31d0e322a8',
      'X-Slack-Request-Timestamp': '1596535313',
      'Content-Length': '366',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Forwarded-Proto': 'https',
      'X-Forwarded-For': '3.90.62.60',
    },
    'httpMethod': 'POST',
    'isBase64Encoded': false,
    'multiValueHeaders': {
      'Host': [
        'bf233132df1c.ngrok.io',
      ],
      'User-Agent': [
        'Slackbot 1.0 (+https://api.slack.com/robots)',
      ],
      'Accept-Encoding': [
        'gzip,deflate',
      ],
      'Accept': [
        'application/json,*/*',
      ],
      'X-Slack-Signature': [
        'v0=2c3a7ce46fdd7c1cf35bbd4b92868d8dccf046d27efdc52598e73c31d0e322a8',
      ],
      'X-Slack-Request-Timestamp': [
        '1596535313',
      ],
      'Content-Length': [
        '366',
      ],
      'Content-Type': [
        'application/x-www-form-urlencoded',
      ],
      'X-Forwarded-Proto': [
        'https',
      ],
      'X-Forwarded-For': [
        '3.90.62.60',
      ],
    },
    'multiValueQueryStringParameters': null,
    'path': '/api/settings',
    'pathParameters': null,
    'queryStringParameters': null,
    'requestContext': {
      'accountId': 'offlineContext_accountId',
      'apiId': 'offlineContext_apiId',
      'authorizer': {
        'principalId': 'offlineContext_authorizer_principalId',
      },
      'domainName': 'offlineContext_domainName',
      'domainPrefix': 'offlineContext_domainPrefix',
      'extendedRequestId': 'ckdfrwjz900200jqs401f0zxw',
      'httpMethod': 'POST',
      'identity': {
        'accessKey': null,
        'accountId': 'offlineContext_accountId',
        'apiKey': 'offlineContext_apiKey',
        'caller': 'offlineContext_caller',
        'cognitoAuthenticationProvider': 'offlineContext_cognitoAuthenticationProvider',
        'cognitoAuthenticationType': 'offlineContext_cognitoAuthenticationType',
        'cognitoIdentityId': 'offlineContext_cognitoIdentityId',
        'cognitoIdentityPoolId': 'offlineContext_cognitoIdentityPoolId',
        'principalOrgId': null,
        'sourceIp': '172.24.0.1',
        'user': 'offlineContext_user',
        'userAgent': 'Slackbot 1.0 (+https://api.slack.com/robots)',
        'userArn': 'offlineContext_userArn',
      },
      'path': '/api/settings',
      'protocol': 'HTTP/1.1',
      'requestId': 'ckdfrwjza00210jqscaznh7l4',
      'requestTime': '04/Aug/2020:20:01:53 +1000',
      'requestTimeEpoch': 1596535313443,
      'resourceId': 'offlineContext_resourceId',
      'resourcePath': '/local/api/settings',
      'stage': 'local',
    },
    'resource': '/local/api/settings',
  },
  1: {
    'body': 'token=GR0v8MoxmPNjtsD0rHn9NMIo&team_id=TRVUTD7DM&team_domain=spotbottest&channel_id=CRU3H4MEC&channel_name=general&user_id=URVUTD7UP&user_name=samchungy&command=%2Fdspotbot&text=settings&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTRVUTD7DM%2F1273433407174%2F96nQIMGR7zu5OZxAD2bH0n3o&trigger_id=1304004152144.879979449463.77bbc613de6ddf581ea50db35033ce1f',
    'headers': {
      'Host': 'bf233132df1c.ngrok.io',
      'User-Agent': 'Slackbot 1.0 (+https://api.slack.com/robots)',
      'Accept-Encoding': 'gzip,deflate',
      'Accept': 'application/json,*/*',
      'X-Slack-Request-Timestamp': '1596535313',
      'Content-Length': '366',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Forwarded-Proto': 'https',
      'X-Forwarded-For': '3.90.62.60',
    },
    'httpMethod': 'POST',
    'isBase64Encoded': false,
    'multiValueHeaders': {
      'Host': [
        'bf233132df1c.ngrok.io',
      ],
      'User-Agent': [
        'Slackbot 1.0 (+https://api.slack.com/robots)',
      ],
      'Accept-Encoding': [
        'gzip,deflate',
      ],
      'Accept': [
        'application/json,*/*',
      ],
      'X-Slack-Signature': [
        'v0=2c3a7ce46fdd7c1cf35bbd4b92868d8dccf046d27efdc52598e73c31d0e322a8',
      ],
      'X-Slack-Request-Timestamp': [
        '1596535313',
      ],
      'Content-Length': [
        '366',
      ],
      'Content-Type': [
        'application/x-www-form-urlencoded',
      ],
      'X-Forwarded-Proto': [
        'https',
      ],
      'X-Forwarded-For': [
        '3.90.62.60',
      ],
    },
    'multiValueQueryStringParameters': null,
    'path': '/api/settings',
    'pathParameters': null,
    'queryStringParameters': null,
    'requestContext': {
      'accountId': 'offlineContext_accountId',
      'apiId': 'offlineContext_apiId',
      'authorizer': {
        'principalId': 'offlineContext_authorizer_principalId',
      },
      'domainName': 'offlineContext_domainName',
      'domainPrefix': 'offlineContext_domainPrefix',
      'extendedRequestId': 'ckdfrwjz900200jqs401f0zxw',
      'httpMethod': 'POST',
      'identity': {
        'accessKey': null,
        'accountId': 'offlineContext_accountId',
        'apiKey': 'offlineContext_apiKey',
        'caller': 'offlineContext_caller',
        'cognitoAuthenticationProvider': 'offlineContext_cognitoAuthenticationProvider',
        'cognitoAuthenticationType': 'offlineContext_cognitoAuthenticationType',
        'cognitoIdentityId': 'offlineContext_cognitoIdentityId',
        'cognitoIdentityPoolId': 'offlineContext_cognitoIdentityPoolId',
        'principalOrgId': null,
        'sourceIp': '172.24.0.1',
        'user': 'offlineContext_user',
        'userAgent': 'Slackbot 1.0 (+https://api.slack.com/robots)',
        'userArn': 'offlineContext_userArn',
      },
      'path': '/api/settings',
      'protocol': 'HTTP/1.1',
      'requestId': 'ckdfrwjza00210jqscaznh7l4',
      'requestTime': '04/Aug/2020:20:01:53 +1000',
      'requestTimeEpoch': 1596535313443,
      'resourceId': 'offlineContext_resourceId',
      'resourcePath': '/local/api/settings',
      'stage': 'local',
    },
    'resource': '/local/api/settings',
  },
  2: {
    'body': 'token=GR0v8MoxmPNjtsD0rHn9NMIo&team_id=TRVUTD7DM&team_domain=spotbottest&channel_id=CRU3H4MEC&channel_name=general&user_id=URVUTD7UP&user_name=samchungy&command=%2Fdspotbot&text=settings&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTRVUTD7DM%2F1273433407174%2F96nQIMGR7zu5OZxAD2bH0n3o&trigger_id=1304004152144.879979449463.77bbc613de6ddf581ea50db35033ce1f',
    'headers': {
      'Host': 'bf233132df1c.ngrok.io',
      'User-Agent': 'Slackbot 1.0 (+https://api.slack.com/robots)',
      'Accept-Encoding': 'gzip,deflate',
      'Accept': 'application/json,*/*',
      'X-Slack-Signature': 'v0=2c3a7ce46fdd7c1cf35bbd4b92868d8dccf046d27efdc52598e73c31d0e322a8',
      'X-Slack-Request-Timestamp': 'abcdefg',
      'Content-Length': '366',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Forwarded-Proto': 'https',
      'X-Forwarded-For': '3.90.62.60',
    },
    'httpMethod': 'POST',
    'isBase64Encoded': false,
    'multiValueHeaders': {
      'Host': [
        'bf233132df1c.ngrok.io',
      ],
      'User-Agent': [
        'Slackbot 1.0 (+https://api.slack.com/robots)',
      ],
      'Accept-Encoding': [
        'gzip,deflate',
      ],
      'Accept': [
        'application/json,*/*',
      ],
      'X-Slack-Signature': [
        'v0=2c3a7ce46fdd7c1cf35bbd4b92868d8dccf046d27efdc52598e73c31d0e322a8',
      ],
      'X-Slack-Request-Timestamp': [
        '1596535313',
      ],
      'Content-Length': [
        '366',
      ],
      'Content-Type': [
        'application/x-www-form-urlencoded',
      ],
      'X-Forwarded-Proto': [
        'https',
      ],
      'X-Forwarded-For': [
        '3.90.62.60',
      ],
    },
    'multiValueQueryStringParameters': null,
    'path': '/api/settings',
    'pathParameters': null,
    'queryStringParameters': null,
    'requestContext': {
      'accountId': 'offlineContext_accountId',
      'apiId': 'offlineContext_apiId',
      'authorizer': {
        'principalId': 'offlineContext_authorizer_principalId',
      },
      'domainName': 'offlineContext_domainName',
      'domainPrefix': 'offlineContext_domainPrefix',
      'extendedRequestId': 'ckdfrwjz900200jqs401f0zxw',
      'httpMethod': 'POST',
      'identity': {
        'accessKey': null,
        'accountId': 'offlineContext_accountId',
        'apiKey': 'offlineContext_apiKey',
        'caller': 'offlineContext_caller',
        'cognitoAuthenticationProvider': 'offlineContext_cognitoAuthenticationProvider',
        'cognitoAuthenticationType': 'offlineContext_cognitoAuthenticationType',
        'cognitoIdentityId': 'offlineContext_cognitoIdentityId',
        'cognitoIdentityPoolId': 'offlineContext_cognitoIdentityPoolId',
        'principalOrgId': null,
        'sourceIp': '172.24.0.1',
        'user': 'offlineContext_user',
        'userAgent': 'Slackbot 1.0 (+https://api.slack.com/robots)',
        'userArn': 'offlineContext_userArn',
      },
      'path': '/api/settings',
      'protocol': 'HTTP/1.1',
      'requestId': 'ckdfrwjza00210jqscaznh7l4',
      'requestTime': '04/Aug/2020:20:01:53 +1000',
      'requestTimeEpoch': 1596535313443,
      'resourceId': 'offlineContext_resourceId',
      'resourcePath': '/local/api/settings',
      'stage': 'local',
    },
    'resource': '/local/api/settings',
  },
};

describe('Slack Authorizer', () => {
  it('should successfully verify a Slack Request', async () => {
    const validTime = (parseInt(event[0].headers['X-Slack-Request-Timestamp'])+100)*1000;
    const sigBaseString = 'v0:' + event[0].headers['X-Slack-Request-Timestamp'] + ':' + event[0].body;
    const mockBuffer = jest.spyOn(Buffer, 'from');

    mockDate.now.mockReturnValue(validTime);
    mockCrypto.createHmac.mockReturnThis();
    mockCrypto.update.mockReturnThis();
    mockCrypto.digest.mockReturnValue('valid signature');
    mockCrypto.timingSafeEqual.mockReturnValue(true);

    expect(mod(event[0])).toBe(true);
    expect(mockDate.now).toBeCalled();
    expect(mockCrypto.createHmac).toBeCalledWith('sha256', secret);
    expect(mockCrypto.update).toBeCalledWith(sigBaseString, 'utf8');
    expect(mockCrypto.digest).toBeCalledWith('hex');
    expect(mockBuffer).toBeCalledWith('v0=' + 'valid signature', 'utf8');
    expect(mockBuffer).toBeCalledWith(event[0].headers['X-Slack-Signature'], 'utf8');
    expect(mockCrypto.timingSafeEqual).toBeCalledWith(expect.anything(), expect.anything());
  });

  it('should fail when signatures do not match', async () => {
    const validTime = (parseInt(event[0].headers['X-Slack-Request-Timestamp'])+100)*1000;
    const sigBaseString = 'v0:' + event[0].headers['X-Slack-Request-Timestamp'] + ':' + event[0].body;
    const mockBuffer = jest.spyOn(Buffer, 'from');

    mockDate.now.mockReturnValue(validTime);
    mockCrypto.createHmac.mockReturnThis();
    mockCrypto.update.mockReturnThis();
    mockCrypto.digest.mockReturnValue('invalid signature');
    mockCrypto.timingSafeEqual.mockReturnValue(false);

    expect(mod(event[0])).toBe(false);
    expect(mockDate.now).toBeCalled();
    expect(mockCrypto.createHmac).toBeCalledWith('sha256', secret);
    expect(mockCrypto.update).toBeCalledWith(sigBaseString, 'utf8');
    expect(mockCrypto.digest).toBeCalledWith('hex');
    expect(mockBuffer).toBeCalledWith('v0=' + 'invalid signature', 'utf8');
    expect(mockBuffer).toBeCalledWith(event[0].headers['X-Slack-Signature'], 'utf8');
    expect(mockCrypto.timingSafeEqual).toBeCalled();
  });

  it('should fail when slack signature is not provided', async () => {
    const validTime = (parseInt(event[1].headers['X-Slack-Request-Timestamp'])+100)*1000;

    mockDate.now.mockReturnValue(validTime);

    expect(mod(event[1])).toBe(false);
    expect(mockDate.now).toBeCalled();
  });

  it('should fail when slack timestamp is not valid', async () => {
    const validTime = 12345;

    mockDate.now.mockReturnValue(validTime);

    expect(mod(event[2])).toBe(false);
    expect(mockDate.now).toBeCalled();
  });
});
