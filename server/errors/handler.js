const logger = require('pino')();

module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    logger.error(err);
    ctx.status = err.status || 500;
    ctx.body = err.message;
  }
};
