const qs = require('qs');
const lambda = require('/opt/lambda');


const slackAuthorized = require('/opt/authorizer');
const {checkIsSetup} = require('/opt/check-settings');

const config = require(process.env.CONFIG);
const logger = require(process.env.LOGGER);
const SETTINGS = config.dynamodb.settings;

const SETTINGS_GET_OPTIONS_PLAYLISTS = process.env.LAMBDA_PREFIX+ 'settings-get-options-playlists';
const SETTINGS_GET_OPTIONS_DEVICES = process.env.LAMBDA_PREFIX + 'settings-get-options-devices';
const SETTINGS_GET_OPTIONS_TIMEZONES = process.env.LAMBDA_PREFIX + 'settings-get-options-timezones';

// const {getAllDevices, getAllPlaylists, getAllTimezones, saveSettings, updateView} = require('../server/components/settings/settings-controller');

module.exports.handler = async (event, context) => {
  let statusCode = 200; let body = '';
  try {
    if (!slackAuthorized(event)) {
      statusCode = 401;
      body = 'Unauathorized';
      return {
        statusCode,
        body,
      };
    }
    const eventPayload = qs.parse(event.body);
    const payload = JSON.parse(eventPayload.payload);
    const {settings} = await checkIsSetup(payload.team.id, payload.view.private_metadata);
    let params;
    switch (payload.action_id) {
      case SETTINGS.playlist:
        params = {
          FunctionName: SETTINGS_GET_OPTIONS_PLAYLISTS, // the lambda function we are going to invoke
          Payload: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, settings: settings, query: payload.value}),
        };
        const {Payload: playlistPayload} = await lambda.invoke(params).promise();
        body = playlistPayload;
        break;
      case SETTINGS.default_device:
        params = {
          FunctionName: SETTINGS_GET_OPTIONS_DEVICES, // the lambda function we are going to invoke
          Payload: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, settings: settings}),
        };
        const {Payload: devicePayload} = await lambda.invoke(params).promise();
        body = devicePayload;
        break;
      case SETTINGS.timezone:
        params = {
          FunctionName: SETTINGS_GET_OPTIONS_TIMEZONES, // the lambda function we are going to invoke
          Payload: JSON.stringify({query: payload.value}),
        };
        const {Payload: timezonePayload} = await lambda.invoke(params).promise();
        body = timezonePayload;
        break;
    }
  } catch (error) {
    logger.error('Slack options router failed');
    logger.error(error);
    body = ':warning: An error occured. Please try again.';
  }
  return {
    statusCode,
    body,
  };
};
