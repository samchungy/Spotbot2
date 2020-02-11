const crypto = require('crypto');
const qs = require('qs');
// fetch this from environment variables
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;

module.exports.handler = function(event, context, callback) {
  // Retrieve request parameters from the Lambda function input:
  const headers = event.headers;
  const slackSignature = headers['x-slack-signature'];
  const requestBody = qs.stringify(ctx.request.body, {format: 'RFC1738'});
  const timestamp = headers['x-slack-request-timestamp'];
  const time = Math.floor(new Date().getTime()/1000);
  if (!Math.abs(time - timestamp) > 300 && slackSigningSecret) {
    const sigBasestring = 'v0:' + timestamp + ':' + requestBody;
    const mySignature = 'v0=' +
                    crypto.createHmac('sha256', slackSigningSecret)
                        .update(sigBasestring, 'utf8')
                        .digest('hex');
    if (crypto.timingSafeEqual(
        Buffer.from(mySignature, 'utf8'),
        Buffer.from(slackSignature, 'utf8'))
    ) {
      return callback(null, generateAllow('me', event.methodArn));
    }
  }
  return callback('Unauthorized');
};

// Help function to generate an IAM policy
const generatePolicy = function(principalId, effect, resource) {
  // Required output:
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17'; // default version
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke'; // default action
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};

const generateAllow = function(principalId, resource) {
  return generatePolicy(principalId, 'Allow', resource);
};
