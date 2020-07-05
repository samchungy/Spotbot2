const crypto = require('crypto');
// fetch this from environment variables
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

const signVerification = (event) => {
  const slackSignature = event.headers['X-Slack-Signature'];
  const timestamp = event.headers['X-Slack-Request-Timestamp'];
  const time = Math.floor(new Date().getTime()/1000);
  if (Math.abs(time - timestamp) <= 300 && slackSignature) {
    const sigBasestring = 'v0:' + timestamp + ':' + event.body;
    const mySignature = 'v0=' +
                    crypto.createHmac('sha256', SLACK_SIGNING_SECRET)
                        .update(sigBasestring, 'utf8')
                        .digest('hex');
    return (crypto.timingSafeEqual(
        Buffer.from(mySignature, 'utf8'),
        Buffer.from(slackSignature, 'utf8'))
    );
  }
  return false;
};

module.exports = signVerification;
