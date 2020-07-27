const lambda = require('/opt/lambda');

const {RouteError, BadRequestError} = require('/opt/errors/errors-route');

const SETTINGS_AUTH_VALIDATE = process.env.LAMBDA_PREFIX + 'settings-auth-validate';

const logger = require('/opt/utils/util-logger');

const router = async (event, context) => {
  if (!event.headers.Referer || !event.headers.Referer.includes('https://accounts.spotify.com')) {
    throw new BadRequestError('Bad Request');
  }
  const stage = `/${event.requestContext.stage}`;
  const url = `${event.headers['X-Forwarded-Proto']}://${event.headers.Host}${stage}`;
  if (event.queryStringParameters && event.queryStringParameters.code && event.queryStringParameters.state) {
    const params = {
      FunctionName: SETTINGS_AUTH_VALIDATE, // the lambda function we are going to invoke
      Payload: JSON.stringify({
        code: event.queryStringParameters.code,
        state: event.queryStringParameters.state,
        url,
      }),
    };
    const {Payload} = await lambda.invoke(params).promise();
    const error = Payload.length ? JSON.parse(Payload) : null;
    if (error) {
      throw new BadRequestError(error);
    }
    return 'Authentication Successful. Please close this window';
  }
  throw new BadRequestError('Bad Request');
};

module.exports.handler = async (event, context) => {
  return await router(event, context)
      .then((data) => ({statusCode: 200, body: data ? data : ''}))
      .catch((error) => {
        if (error instanceof RouteError) {
          return {statusCode: error.code, body: error.message};
        }
        logger.error(error, 'Uncategorized Error in Spotify-Auth Callback Router');
        return {statusCode: 500, body: 'An unknown error occured. Please try again'};
      });
};
