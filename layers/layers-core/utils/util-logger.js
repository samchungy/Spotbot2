const logger = require('pino')({level: process.env.LOG_LEVEL || 'info'});

module.exports = logger;
