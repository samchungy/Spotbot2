require('dotenv').config();
const serverless = require('serverless-http');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-pino-logger');
const errorHandler = require('./errors/errors-handler');
const router = require('./index')({Router});
const app = new Koa();

app
    .use(logger({level: process.env.LOG_LEVEL}))
    .use(errorHandler)
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods());

if (process.env.NODE_ENV == 'test') {
  module.exports.mockapp = app.listen(3000);
}
module.exports.handler = serverless(app);
