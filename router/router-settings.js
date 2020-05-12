const qs = require('qs');
const sns = require('/opt/sns');

const logger = require(process.env.LOGGER);
const config = require(process.env.CONFIG);

const slackAuthorized = require('/opt/authorizer');
const {openModal} = require('/opt/slack-modal');
const {checkIsSetup} = require('/opt/check-settings');
const {checkIsInChannel} = require('/opt/check-channel');
const {checkIsAdmin} = require('/opt/check-admin');

const EMPTY_MODAL = config.slack.actions.empty_modal;
const HELP = 'To get started, add the Spotbot to a channel and then run `/spotbot settings`.\n\n*Find Tracks*\n\n`/find [track]` - Find a track on Spotify\n`/artist [artist]` - Find an artist on Spotify\n`/removetracks` - Lists tracks you added to remove from the playlist\n\n*Playback Status*\n\n`/current` - Show the current playing track and it’s position in the playlist\n`/whom` - Show who requested the current track\n\n*Control*\n\n`/control` - Opens the Spotbot control panel\n`/play` - Pauses playback of Spotify\n`/pause`- Pauses playback of Spotify\n`/skip` - Starts a vote to skip a track\n`/reset` - Nukes the playlist\n\n*Admin Commands*\n\n`/spotbot settings` - Opens the Spotbot Settings panel.\n`/spotbot blacklist` - Opens the Spotbot Blacklist panel.\n`/spotbot device` - Opens the Spotbot Device switch panel.\n\nTo delete Spotbot and it\'s configurations from a channel, simply remove the app from the channel.';
const INVALID = `:information_source: Invalid Command.`;
const MIDDLEWARE_RESPONSE = {
  admin_error: (users) => `:information_source: You must be a Spotbot admin for this channel to use this command. Current channel admins: ${users.map((user)=>`<@${user}>`).join(', ')}.`,
  setup_error: ':information_source: Spotbot is not installed in this channel. Please run `/invite @spotbot` and try again.',
  settings_error: ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.',
};

const SETTINGS_OPEN = process.env.SNS_PREFIX + 'settings-open';
const SETTINGS_BLACKLIST_OPEN = process.env.SNS_PREFIX + 'settings-blacklist-open';
const SETTINGS_DEVICE_SELECT = process.env.SNS_PREFIX + 'settings-device-select';
const SETTINGS_SONOS_OPEN = process.env.SNS_PREFIX + 'settings-sonos-open';


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
    const stage = event.requestContext.stage === 'local' ? `` : `/${event.requestContext.stage}`;
    const url = `${event.headers['X-Forwarded-Proto']}://${event.headers.Host}${stage}`;
    const payload = qs.parse(event.body);
    if (payload.text) {
      const textSplit = payload.text.split(' ');
      if (textSplit.length == 0 || textSplit[0] == 'help') {
        body = HELP;
        return {
          statusCode,
          body,
        };
      } else {
        const {settings, isSetup} = await checkIsSetup(payload.team_id, payload.channel_id);
        let params; let admins;
        switch (textSplit[0]) {
          case 'settings':
            if (!isSetup) {
              if (!(await checkIsInChannel(payload.channel_id))) {
                body = MIDDLEWARE_RESPONSE.setup_error;
                break;
              }
            } else {
              admins = checkIsAdmin(settings, payload.user_id);
              if (admins !== true) {
                body = MIDDLEWARE_RESPONSE.admin_error(admins);
                return {
                  statusCode,
                  body,
                };
              }
            }
            const settingsPayload = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Spotbot Settings', null, 'Cancel');
            params = {
              Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings, viewId: settingsPayload.view.id, userId: payload.user_id, url}),
              TopicArn: SETTINGS_OPEN,
            };
            await sns.publish(params).promise();
            break;
          case 'blacklist':
          case 'device':
          case 'sonos':
            if (!settings) {
              body = ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.';
              return {
                statusCode,
                body,
              };
            }
            admins = checkIsAdmin(settings, payload.user_id);
            if (admins !== true) {
              body = MIDDLEWARE_RESPONSE.admin_error(admins);
              return {
                statusCode,
                body,
              };
            }
            switch (textSplit[0]) {
              case 'blacklist':
                const blacklistPayload = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, `Spotbot Blacklist`, null, 'Cancel');
                params = {
                  Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings: settings, viewId: blacklistPayload.view.id, userId: payload.user_id}),
                  TopicArn: SETTINGS_BLACKLIST_OPEN,
                };
                await sns.publish(params).promise();
                break;
              case 'device':
                const devicePayload = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Spotify Devices', null, 'Cancel');
                params = {
                  Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings: settings, viewId: devicePayload.view.id, userId: payload.user_id}),
                  TopicArn: SETTINGS_DEVICE_SELECT,
                };
                await sns.publish(params).promise();
                break;
              case 'sonos':
                const sonosPayload = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Sonos Settings', null, 'Cancel');
                params = {
                  Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings: settings, viewId: sonosPayload.view.id, userId: payload.user_id, url}),
                  TopicArn: SETTINGS_SONOS_OPEN,
                };
                await sns.publish(params).promise();
                break;
            }
            break;
          default:
            body = INVALID;
            break;
        }
      }
    } else {
      body = HELP;
    }
  } catch (error) {
    logger.error('Settings router failed');
    logger.error(error);
    body = ':warning: An error occured. Please try again.';
  }
  return {
    statusCode,
    body,
  };
};
