
const slackRouter = require('./components/slack/slack-route');
const settingsRouter = require('./components/settings/settings-route');
const controlRouter = require('./components/control/control-route');
const tracksRouter = require('./components/tracks/tracks-route');

module.exports = ({Router}) => {
  const router = new Router();

  const slackRoute = slackRouter('/slack/actions', Router);
  const settingsRoute = settingsRouter('/settings', Router);
  const controlRoute = controlRouter('/control', Router);
  const tracksRoute = tracksRouter('/tracks', Router);

  router
      .use(slackRoute.routes())
      .use(settingsRoute.routes())
      .use(controlRoute.routes())
      .use(tracksRoute.routes());

  return router;
};
