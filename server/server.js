const serverless = require('serverless-http');
const config = require('config');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-pino-logger');
const errorHandler = require('./errors/handler')
const router = require('./index')({Router});
const app = new Koa();

app
    .use(logger({level: 'info'}))
    .use(errorHandler)
    .use(bodyParser())
    .use(router.routes())
    .use(router.allowedMethods())

module.exports.handler = serverless(app);