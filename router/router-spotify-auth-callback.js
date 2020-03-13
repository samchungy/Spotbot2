const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda();

const SETTINGS_AUTH_VALIDATE = process.env.LAMBDA_PREFIX + 'settings-auth-validate';

const logger = require(process.env.LOGGER);

module.exports.handler = async (event, context) => {
  const statusCode = 200; let body = '';
  try {
    const protocol = event.headers['X-Forwarded-Proto'];
    const host = event.requestContext.domainName;
    if (event.queryStringParameters && event.queryStringParameters.code && event.queryStringParameters.state) {
      const params = {
        FunctionName: SETTINGS_AUTH_VALIDATE, // the lambda function we are going to invoke
        Payload: JSON.stringify({code: event.queryStringParameters.code, state: event.queryStringParameters.state, url: `${protocol}://${host}`}),
      };
      const {Payload: payload} = await lambda.invoke(params).promise();
      const {success, failReason} = JSON.parse(payload);
      if (success) {
        body = 'Authentication Successful. Please close this window';
      } else {
        status = 401;
        body = failReason;
      }
    }
  } catch (error) {
    logger.error('Spotify auth router failed');
    logger.error(error);
    body = ':warning: An error occured. Please try again.';
  }
  return {
    statusCode,
    body,
  };
};
