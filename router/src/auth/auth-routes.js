const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda();

const SETTINGS_AUTH_VALIDATE = process.env.LAMBDA_PREFIX + 'settings-auth-validate';

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });

  router.get('/', async (ctx, next) => {
    const params = {
      FunctionName: SETTINGS_AUTH_VALIDATE, // the lambda function we are going to invoke
      Payload: JSON.stringify({code: ctx.query.code, state: ctx.query.state, url: `${ctx.protocol}://${ctx.host}`}),
    };
    const {Payload: payload} = await lambda.invoke(params).promise();
    const {success, failReason} = JSON.parse(payload);
    if (success) {
      ctx.body = 'Authentication Successful. Please close this window';
    } else {
      ctx.status = 401;
      ctx.body = failReason;
    }
  });
  return router;
};
