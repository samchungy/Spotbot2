const logger = require('../../util/logger');
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
        //Implement General Spotbot Help Menu
      } else{
        switch (textSplit[0]){
          case "settings":
            ctx.body = "";
            openSettings(payload.trigger_id);
            break;
          case "auth":
            let auth_url = await getAuthorizationURL(payload.trigger_id);
            ctx.body = auth_url;
        }
      }
    })
    return router;
};

