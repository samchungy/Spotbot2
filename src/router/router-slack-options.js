const qs = require('querystring');
const lambda = require('/opt/lambda');


const slackAuthorized = require('/opt/router/authorizer');
const {loadSettings} = require('/opt/db/settings-interface');
const {SetupError} = require('/opt/errors/errors-settings');

const config = require('/opt/config/config');
const logger = require('/opt/utils/util-logger');
const SETTINGS = config.dynamodb.settings;

const SETTINGS_GET_OPTIONS_PLAYLISTS = process.env.LAMBDA_PREFIX+ 'settings-get-options-playlists';
const SETTINGS_GET_OPTIONS_DEVICES = process.env.LAMBDA_PREFIX + 'settings-get-options-devices';
const SETTINGS_GET_OPTIONS_TIMEZONES = process.env.LAMBDA_PREFIX + 'settings-get-options-timezones';

const router = async (event, context) => {
  const eventPayload = qs.parse(event.body);
  const payload = JSON.parse(eventPayload.payload);
  switch (payload.action_id) {
    case SETTINGS.playlist: {
      const params = {
        FunctionName: SETTINGS_GET_OPTIONS_PLAYLISTS, // the lambda function we are going to invoke
        Payload: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.view.private_metadata,
          settings: await loadSettings(payload.team.id, payload.view.private_metadata),
          query: payload.value,
          user: payload.user.id,
        }),
      };
      const {Payload: lambdaPayload} = await lambda.invoke(params).promise();
      return lambdaPayload;
    }
    case SETTINGS.default_device: {
      const params = {
        FunctionName: SETTINGS_GET_OPTIONS_DEVICES, // the lambda function we are going to invoke
        Payload: JSON.stringify({
          teamId: payload.team.id,
          channelId: payload.view.private_metadata,
          settings: await loadSettings(payload.team.id, payload.view.private_metadata),
          user: payload.user.id,
        }),
      };
      const {Payload: lambdaPayload} = await lambda.invoke(params).promise();
      return lambdaPayload;
    }
    case SETTINGS.timezone: {
      const params = {
        FunctionName: SETTINGS_GET_OPTIONS_TIMEZONES, // the lambda function we are going to invoke
        Payload: JSON.stringify({
          channelId: payload.view.private_metadata,
          query: payload.value,
          user: payload.user.id,
        }),
      };
      const {Payload: lambdaPayload} = await lambda.invoke(params).promise();
      return lambdaPayload;
    }
  }
};

module.exports.handler = async (event, context) => {
  if (!slackAuthorized(event)) {
    return {statusCode: 401, body: 'Unauathorized'};
  }
  return await router(event, context)
      .then((data) => ({statusCode: 200, body: data ? data: ''}))
      .catch((error) => {
        if (error instanceof SetupError) {
          return {statusCode: 200, body: error.message};
        }
        logger.error(error, 'Uncategorized Error in Slack Actions Router');
      });
};
