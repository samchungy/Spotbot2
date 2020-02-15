const DynamoDB = require('aws-sdk/clients/dynamodb');
// const options = {
//   'region': 'localhost',
//   'endpoint': 'http://localhost:8000',
// };

const dynamodb = new DynamoDB.DocumentClient();

module.exports = dynamodb;
