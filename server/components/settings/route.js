const { openSettings } = require('./settings');
const { getAuthorizationURL } = require('../spotify-auth/spotifyAuth');

module.exports = ( prefix, Router ) => {
    const router = new Router({
        prefix: prefix
    });
    router
    .post('/', async (ctx, next) => {
      let payload = ctx.request.body;
      let textSplit = payload.text.split(' ');
      if(textSplit.length == 0){
        //TODO Enter general Spotbot Help method
      } else{
        switch (textSplit[0]){
          case "settings":
            ctx.body = "Hello Settings";
            break;
          case "auth":
            let auth_url = await getAuthorizationURL(payload.trigger_id);
            ctx.body = auth_url;
        }
      }
    })
    return router;
};

