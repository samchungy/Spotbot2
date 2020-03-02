const crypto = require('crypto');
// fetch this from environment variables
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

const signVerification = async (ctx, next) => {
  const slackSignature = ctx.headers['x-slack-signature'];
  const timestamp = ctx.headers['x-slack-request-timestamp'];
  const requestBody = ctx.request.rawBody;
  const sigBasestring = 'v0:' + timestamp + ':' + requestBody;
  const mySignature = 'v0=' +
                  crypto.createHmac('sha256', SLACK_SIGNING_SECRET)
                      .update(sigBasestring, 'utf8')
                      .digest('hex');
  if (crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(slackSignature, 'utf8'))
  ) {
    await next();
  } else {
    ctx.body = 'Verification failed';
    ctx.status = 400;
  }
};

module.exports = signVerification;
