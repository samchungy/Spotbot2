const slackVerifyRequest = require('./middleware/authorizer-body');
const slackActionsRouter = require('./src/slack/slack-actions-route');
const slackEventsRouter = require('./src/slack/slack-events-route');
const slackOptionsRouter = require('./src/slack/slack-options-route');
const settingsRouter = require('./src/settings/settings-route');
const controlRouter = require('./src/control/control-route');
const tracksRouter = require('./src/tracks/tracks-route');
const authRouter = require('./src/auth/auth-routes');

module.exports = ({Router}) => {
  const router = new Router();

  const authRoute = authRouter('/spotify-auth-callback', Router);
  const settingsRoute = settingsRouter('/api/settings', Router);
  const slackActionsRoute = slackActionsRouter('/api/slack/actions', Router);
  const slackOptionsRoute = slackOptionsRouter('/api/slack/options', Router);
  const slackEventsRoute = slackEventsRouter('/api/slack/events', Router);
  const controlRoute = controlRouter('/api/control', Router);
  const tracksRoute = tracksRouter('/api/tracks', Router);

  router
      .use(authRoute.routes())
      .use(slackVerifyRequest)
      .use(settingsRoute.routes())
      .use(slackActionsRoute.routes())
      .use(slackOptionsRoute.routes())
      .use(slackEventsRoute.routes())
      .use(controlRoute.routes())
      .use(tracksRoute.routes());

  return router;
};
