const slackVerifyRequest = require('./middleware/authorizer-body');
// const slackRouter = require('./src/slack/slack-route');
const settingsRouter = require('./src/settings/settings-route');
// const controlRouter = require('./src/control/control-route');
// const tracksRouter = require('./src/tracks/tracks-route');
const authRouter = require('./src/auth/auth-routes');

module.exports = ({Router}) => {
  const router = new Router();

  const authRoute = authRouter('/spotify-auth-callback', Router);
  // const slackRoute = slackRouter('/api/slack/actions', Router);
  const settingsRoute = settingsRouter('/api/settings', Router);
  // const controlRoute = controlRouter('/api/control', Router);
  // const tracksRoute = tracksRouter('/api/tracks', Router);

  router
      .use(authRoute.routes())
      .use(slackVerifyRequest)
      .use(settingsRoute.routes());
  // .use(slackRoute.routes())
  // .use(controlRoute.routes())
  // .use(tracksRoute.routes());

  return router;
};
