
const slackRouter = require('./slack-route');
const settingsRouter = require('./settings-route');
const controlRouter = require('./control-route');
const tracksRouter = require('./tracks-route');
const authRouter = require('./auth-route');

module.exports = ({Router}) => {
  const router = new Router();

  const authRoute = authRouter('/spotify-auth-callback', Router);
  const slackRoute = slackRouter('api/slack/actions', Router);
  const settingsRoute = settingsRouter('api/settings', Router);
  const controlRoute = controlRouter('api/control', Router);
  const tracksRoute = tracksRouter('api/tracks', Router);

  router
      .use(authRoute.routes())
      .use(slackRoute.routes())
      .use(settingsRoute.routes())
      .use(controlRoute.routes())
      .use(tracksRoute.routes());

  return router;
};
