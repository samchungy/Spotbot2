
const slackRouter = require('./components/slack/route');
const settingsRouter = require('./components/settings/route');
const spotifyAuthRouter = require('./components/spotify-auth/route')
const controlRouter = require('./components/control/route');
const tracksRouter = require('./components/tracks/route');

module.exports = ({Router}) => {
    const router = new Router();

    const slackRoute = slackRouter('/slack/actions', Router);
    const settingsRoute = settingsRouter('/settings', Router);
    const controlRoute = controlRouter('/control', Router);
    const tracksRoute = tracksRouter('/tracks', Router);
    const spotifyAuthRoute = spotifyAuthRouter('/auth', Router);
    
    router
        .use(slackRoute.routes())
        .use(settingsRoute.routes())
        .use(controlRoute.routes())
        .use(tracksRoute.routes())
        .use(spotifyAuthRoute.routes())
        
    return router;
}