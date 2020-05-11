const SNS = require('aws-sdk/clients/sns');
const sns = new SNS(process.env.ENV == 'local' ? {
  endpoint: 'http://127.0.0.1:4002',
  region: 'ap-southeast-2',
  accessKeyId: 'DEFAULT_ACCESS_KEY',
  secretAccessKey: 'DEFAULT_SECRET',
} : {});

module.exports = sns;
