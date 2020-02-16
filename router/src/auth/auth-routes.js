const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda();

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });

  router.get('/', async (ctx, next) => {
    const params = {
      FunctionName: process.env.SETTINGS_AUTH_VALIDATE, // the lambda function we are going to invoke
      Payload: JSON.stringify({code: ctx.query.code, state: ctx.query.state}),
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
