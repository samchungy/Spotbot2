module.exports.handler = async (event, context) => {
  // Retrieve request parameters from the Lambda function input:
  const headers = event.headers;
  const slackSignature = headers['X-Slack-Signature'];
  const timestamp = headers['X-Slack-Request-Timestamp'];
  const time = Math.floor(new Date().getTime()/1000);
  if (Math.abs(time - timestamp) <= 300 && slackSignature) {
    return generateAllow('me', event.methodArn);
  }
  return 'Unauthorized';
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
