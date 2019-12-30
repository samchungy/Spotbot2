const logger = require('pino')({level: process.env.LOG_LEVEL});

module.exports = logger;
