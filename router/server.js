const serverless = require('serverless-http');
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const errorHandler = require('./error-handler');
const router = require('./index')({Router});
const app = new Koa();

app
    .use(logger())
    .use(errorHandler)
    .use(bodyParser({
      formLimit: '10mb',
    }))
    .use(router.routes())
    .use(router.allowedMethods());

if (process.env.NODE_ENV == 'test') {
  module.exports = ({port}) => app.listen(port);
}
module.exports.handler = serverless(app);
