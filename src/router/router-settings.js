const qs = require('querystring');
const sns = require('/opt/sns');

const logger = require('/opt/utils/util-logger');
const config = require('/opt/config/config');

const slackAuthorized = require('/opt/router/authorizer');
const {openModal} = require('/opt/router/slack-modal');

// Middleware
const {checkIsAdmin, checkIsInChannel, checkIsSetup, checkIsPreviouslySetup} = require('/opt/router/check-settings');
const {SettingsError, SetupError} = require('/opt/errors/errors-settings');

const EMPTY_MODAL = config.slack.actions.empty_modal;
const RESPONSE = {
  help: 'To get started, add the Spotbot to a channel and then run `/spotbot settings`.\n\n*Find Tracks*\n\n`/find [track]` - Find a track on Spotify\n`/artist [artist]` - Find an artist on Spotify\n`/removetracks` - Lists tracks you added to remove from the playlist\n\n*Playback Status*\n\n`/current` - Show the current playing track and it’s position in the playlist\n`/whom` - Show who requested the current track\n\n*Control*\n\n`/control` - Opens the Spotbot control panel\n`/play` - Pauses playback of Spotify\n`/pause`- Pauses playback of Spotify\n`/skip` - Starts a vote to skip a track\n`/reset` - Nukes the playlist\n\n*Admin Commands*\n\n`/spotbot settings` - Opens the Spotbot Settings panel.\n`/spotbot blacklist` - Opens the Spotbot Blacklist panel.\n`/spotbot device` - Opens the Spotbot Device switch panel.\n\nTo delete Spotbot and it\'s configurations from a channel, simply remove the app from the channel.',
  invalid: `:information_source: Invalid Command.`,
  failed: 'Uncategorized Error in Settings Router',
  error: ':warning: An error occured. Please try again.',
  unauthorized: 'Unauathorized',
};

const SETTINGS_OPEN = process.env.SNS_PREFIX + 'settings-open';
const SETTINGS_BLACKLIST_OPEN = process.env.SNS_PREFIX + 'settings-blacklist-open';
const SETTINGS_DEVICE_SELECT = process.env.SNS_PREFIX + 'settings-device-select';
// const SETTINGS_SONOS_OPEN = process.env.SNS_PREFIX + 'settings-sonos-open';

const router = async (event, context) => {
  const stage = `/${event.requestContext.stage}`;
  const url = `${event.headers['X-Forwarded-Proto']}://${event.headers.Host}${stage}`;
  const payload = qs.parse(event.body);

  if (payload.text) {
    const textSplit = payload.text.split(' ');
    if (textSplit.length == 0 || textSplit[0] == 'help') {
      return RESPONSE.help;
    }
    switch (textSplit[0]) {
      case 'settings': {
        const settings = await checkIsPreviouslySetup(payload.team_id, payload.channel_id)
            .catch(async (error) => {
              if (error.constructor === SetupError) {
              // Check if Spotbot is installed in this channel:
                await checkIsInChannel(payload.channel_id);
                return null;
              }
              throw error;
            });

        // See if Spotbot is setup if so we need to check user is admin.
        await checkIsSetup(payload.team_id, payload.channel_id, settings)
            .then(() => checkIsAdmin(settings, payload.user_id))
            .catch((error) => {
            // Spotbot is not setup, let em through
              if (error instanceof SettingsError) {
                return;
              }
              throw error;
            });

        const modal = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Spotbot Settings', null, 'Cancel');
        const params = {
          Message: JSON.stringify({
            teamId: payload.team_id,
            channelId: payload.channel_id,
            settings,
            viewId: modal.view.id,
            userId: payload.user_id,
            url,
          }),
          TopicArn: SETTINGS_OPEN,
        };
        await sns.publish(params).promise();
        return;
      }
      case 'blacklist': {
        const modal = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, `Spotbot Blacklist`, null, 'Cancel');
        const params = {
          Message: JSON.stringify({
            teamId: payload.team_id,
            channelId: payload.channel_id,
            settings: await checkIsSetup(payload.team_id, payload.channel_id).then(async (data) => (await checkIsAdmin(data, payload.user_id), data)),
            viewId: modal.view.id,
            userId: payload.user_id,
          }),
          TopicArn: SETTINGS_BLACKLIST_OPEN,
        };
        await sns.publish(params).promise();
        return;
      }
      case 'device': {
        const modal = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Spotify Devices', null, 'Cancel');
        const params = {
          Message: JSON.stringify({
            teamId: payload.team_id,
            channelId: payload.channel_id,
            settings: await checkIsSetup(payload.team_id, payload.channel_id).then(async (data) => (await checkIsAdmin(data, payload.user_id), data)),
            viewId: modal.view.id,
            userId: payload.user_id,
          }),
          TopicArn: SETTINGS_DEVICE_SELECT,
        };
        await sns.publish(params).promise();
        return;
      }
      // case 'sonos': {
      //   const modal = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Sonos Settings', null, 'Cancel');
      //   const params = {
      //     Message: JSON.stringify({
      //       teamId: payload.team_id,
      //       channelId: payload.channel_id,
      //       settings: await checkIsSetup(payload.team_id, payload.channel_id).then(async (data) => (await checkIsAdmin(data, payload.user_id), data)),
      //       viewId: modal.view.id,
      //       userId: payload.user_id,
      //       url,
      //     }),
      //     TopicArn: SETTINGS_SONOS_OPEN,
      //   };
      //   await sns.publish(params).promise();
      //   return;
      // }
      default: {
        return RESPONSE.invalid;
      }
    }
  }
  return RESPONSE.help;
};

module.exports.handler = async (event, context) => {
  if (!slackAuthorized(event)) {
    return {statusCode: 401, body: RESPONSE.unauthorized};
  }
  return await router(event, context)
      .then((data) => ({statusCode: 200, body: data ? data: ''}))
      .catch((error) => {
        if (error instanceof SetupError) {
          return {statusCode: 200, body: error.message};
        }
        logger.error(error, RESPONSE.failed);
        return {statusCode: 200, body: RESPONSE.error};
      });
};
