const DynamoDB = require('aws-sdk/clients/dynamodb');
const dynamodb = new DynamoDB.DocumentClient(
    process.env.ENV == 'local' ? {
      endpoint: 'http://localhost:8000',
      region: 'localhost',
      accessKeyId: 'DEFAULT_ACCESS_KEY',
      secretAccessKey: 'DEFAULT_SECRET',
    } : {},
);

module.exports = dynamodb;
