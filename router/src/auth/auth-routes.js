const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda();
const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();

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
    const {success, failReason, state} = JSON.parse(payload);
    if (success) {
      const params = {
        Message: JSON.stringify({teamId: state.teamId, channelId: state.channelId}),
        TopicArn: process.env.SETTINGS_UPDATE_VIEW,
      };
      await sns.publish(params).promise();
      ctx.body = 'Authentication Successful. Please close this window';
    } else {
      ctx.status = 401;
      ctx.body = failReason;
    }
  });
  return router;
};
