const {default: axios} = require('axios');
const config = require('./config');

const client = (token) => {
  return axios.create({
    baseURL: config.baseUrl,
    timeout: 1500,
    headers: {'Authorization': `Bearer ${token}`},
  });
};

module.exports = client;
