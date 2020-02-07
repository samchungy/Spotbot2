const crypto = require('crypto');
const qs = require('qs');
// fetch this from environment variables
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const signVerification = async (ctx, next) => {
  const slackSignature = ctx.headers['x-slack-signature'];
  const requestBody = qs.stringify(ctx.request.body, {format: 'RFC1738'});
  const timestamp = ctx.headers['x-slack-request-timestamp'];
  const time = Math.floor(new Date().getTime()/1000);
  if (Math.abs(time - timestamp) > 300) {
    ctx.body =('Ignore this request.');
    ctx.status = 400;
  } else if (!slackSigningSecret) {
    ctx.body = 'Slack signing secret is empty.';
    ctx.status = 400;
  } else {
    const sigBasestring = 'v0:' + timestamp + ':' + requestBody;
    const mySignature = 'v0=' +
                    crypto.createHmac('sha256', slackSigningSecret)
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
  }
};

module.exports = signVerification;
