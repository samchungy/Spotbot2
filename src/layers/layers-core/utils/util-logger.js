const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...process.env.ENV === 'local' ? {
    prettyPrint: {
      errorLikeObjectKeys: ['err', 'error'],
      colorize: true,
      translateTime: 'SYS:h:MM:ss TT',
    },
  } : {},
});

module.exports = logger;
