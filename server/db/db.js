const AWS = require('aws-sdk');
const config = require('config');
const options = {
    "region": "localhost",
    "endpoint": "http://localhost:8000"
}

var dynamodb = new AWS.DynamoDB.DocumentClient(options);

module.exports = dynamodb;