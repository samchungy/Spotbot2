const lambda = require('/opt/lambda');


const SETTINGS_SONOS_AUTH_VALIDATE = process.env.LAMBDA_PREFIX + 'settings-sonos-auth-validate';

const logger = require('/opt/utils/util-logger');

module.exports.handler = async (event, context) => {
  let statusCode = 200; let body = '';
  try {
    const stage = `/${event.requestContext.stage}`;
    const url = `${event.headers['X-Forwarded-Proto']}://${event.headers.Host}${stage}`;
    if (event.queryStringParameters && event.queryStringParameters.code && event.queryStringParameters.state) {
      const params = {
        FunctionName: SETTINGS_SONOS_AUTH_VALIDATE, // the lambda function we are going to invoke
        Payload: JSON.stringify({code: event.queryStringParameters.code, state: event.queryStringParameters.state, url}),
      };
      const {Payload: payload} = await lambda.invoke(params).promise();
      const {success, failReason} = JSON.parse(payload);
      if (success) {
        body = 'Authentication Successful. Please close this window';
      } else {
        statusCode = 401;
        body = failReason;
      }
    }
  } catch (error) {
    logger.error('Spotify sonos auth router failed');
    logger.error(error);
    body = ':warning: An error occured. Please try again.';
  }
  return {
    statusCode,
    body,
  };
};
