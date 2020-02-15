const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();

const {validateAuthCode} = require('/opt/spotify/spotify-auth/spotifyauth-controller');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });

  router.get('/', async (ctx, next) => {
    ctx.body = 'test';
    const {success, failReason, state} = await validateAuthCode(ctx.query.code, ctx.query.state);
    if (success) {
      ctx.body = 'Authentication Successful. Please close this window';
      const params = {
        Message: JSON.stringify({teamId: state.teamId, channelId: state.channelId}),
        TopicArn: process.env.SETTINGS_UPDATE_VIEW,
      };
      await sns.publish(params).promise(); ;
    } else {
      ctx.status = 401;
      ctx.body = failReason;
    }
  });
  return router;
};
