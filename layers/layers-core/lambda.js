const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda(process.env.ENV == 'local' ?
  {
    endpoint: 'http://localhost:3002',
    accessKeyId: 'DEFAULT_ACCESS_KEY',
    secretAccessKey: 'DEFAULT_SECRET',
  } : {},
);

module.exports = lambda;
