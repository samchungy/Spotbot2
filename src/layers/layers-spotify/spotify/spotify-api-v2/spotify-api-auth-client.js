const config = require('./config');
const {default: axios} = require('axios');

const client = axios.create({
  baseURL: config.baseAuthUrl,
  timeout: 1000,
  headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  auth: {
    username: config.clientId,
    password: config.clientSecret,
  },
});

module.exports=client;
