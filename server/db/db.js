const AWS = require('aws-sdk');
const options = {
  'region': 'localhost',
  'endpoint': 'http://localhost:8000',
};

const dynamodb = new AWS.DynamoDB.DocumentClient(options);

module.exports = dynamodb;
