const DELETE_CHANNEL = process.env.SNS_PREFIX + 'delete-channel';
const {loadSettings} = require('/opt/settings/settings-interface');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .post('/', async (ctx, next) =>{
        const payload = ctx.request.body;
        switch (payload.type) {
          case 'url_verification':
            ctx.body = payload.challenge;
            break;
          case 'event_callback':
            const settings = await loadSettings(payload.team_id, payload.event.channel);
            params = {
              Message: JSON.stringify({teamId: payload.team.id, channelId: payload.event.channel, settings}),
              TopicArn: CONTROL_RESET_SET,
            };
            await sns.publish(params).promise();
            ctx.body = '';
            break;
        }
      });

  return router;
};
