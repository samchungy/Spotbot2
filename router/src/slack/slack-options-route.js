const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda();

const config = require(process.env.CONFIG);
const SETTINGS = config.dynamodb.settings;

// const {getAllDevices, getAllPlaylists, getAllTimezones, saveSettings, updateView} = require('../server/components/settings/settings-controller');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .post('/', async (ctx, next) =>{
        if (ctx.request.body && ctx.request.body.payload) {
          const payload = JSON.parse(ctx.request.body.payload);
          const settings = ctx.state.settings;
          let options; let params;
          switch (payload.action_id) {
            case SETTINGS.playlist:
              params = {
                FunctionName: process.env.SETTINGS_GET_OPTIONS_PLAYLISTS, // the lambda function we are going to invoke
                Payload: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, settings: settings, query: payload.value}),
              };
              const {Payload: playlistPayload} = await lambda.invoke(params).promise();
              options = JSON.parse(playlistPayload);
              ctx.body = options;
              break;
            case SETTINGS.default_device:
              params = {
                FunctionName: process.env.SETTINGS_GET_OPTIONS_DEVICES, // the lambda function we are going to invoke
                Payload: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, settings: settings}),
              };
              const {Payload: devicePayload} = await lambda.invoke(params).promise();
              options = JSON.parse(devicePayload);
              ctx.body = options;
              break;
            case SETTINGS.timezone:
              params = {
                FunctionName: process.env.SETTINGS_GET_OPTIONS_TIMEZONES, // the lambda function we are going to invoke
                Payload: JSON.stringify({query: payload.value}),
              };
              const {Payload: timezonePayload} = await lambda.invoke(params).promise();
              options = JSON.parse(timezonePayload);
              ctx.body = options;
              break;
          }
        }
      });

  return router;
};
