const logger = require('../../util/logger');
const { openSettings, updateView } = require('./settings');
const { validateAuthCode, getAuthorizationURL } = require('./spotifyAuth');

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
    .get('/auth/callback', async (ctx, next) => {
      let { success, failReason } = await validateAuthCode(ctx.query.code, ctx.query.state);
      if (success){
        ctx.body = "Auth Success"
        // ctx.redirect('') TODO ADD Slack URL
      } else {
        ctx.status = 401
        ctx.body = failReason;
      }
      updateView(failReason);
    })
    return router;
};

