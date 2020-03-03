const config = require(process.env.CONFIG);
const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();
const {openModal} = require('../response/open-modal');
const {checkIsAdmin, checkIsInChannel, checkIsSetup, checkSettings} = require('./settings-check');

const EMPTY_MODAL = config.slack.actions.empty_modal;
const HELP = '*Find Tracks*\n\n`/find [track]` - Find a track on Spotify\n`/artist [artist]` - Find an artist on Spotify\n`/removetracks` - Lists tracks you added to remove from the playlist\n\n*Playback Status*\n\n`/current` - Show the current playing track and it’s position in the playlist\n`/whom` - Show who requested the current track\n\n*Control*\n\n`/control` - Opens the Spotbot control panel\n`/play` - Pauses playback of Spotify\n`/pause`- Pauses playback of Spotify\n`/skip` - Starts a vote to skip a track\n`/reset` - Nukes the playlist\n\n*Admin Commands*\n\n`/spotbot settings` - Opens the Spotbot Settings panel.\n`/spotbot blacklist` - Opens the Spotbot Blacklist panel.\n`/spotbot device` - Opens the Spotbot Device switch panel.\n\n To delete Spotbot and it\'s configurations from a channel, simply remove the app from the channel.';
const INVALID = `:information_source: Invalid Command.`;

const MIDDLEWARE_RESPONSE = {
  admin_error: (users) => `:information_source: You must be a Spotbot admin for this channel to use this command. Current channel admins: ${users.map((user)=>`<@${user}>`).join(', ')}.`,
  setup_error: `:information_source: Spotbot is not installed in this channel. Please add the Spotbot app to this channel and try again.`,
  settings_error: ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.',
};

const SETTINGS_OPEN = process.env.SNS_PREFIX + 'settings-open';
const SETTINGS_BLACKLIST_OPEN = process.env.SNS_PREFIX + 'settings-blacklist-open';
const SETTINGS_DEVICE_SELECT = process.env.SNS_PREFIX + 'settings-device-select';

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .post('/', async (ctx, next) => {
        const payload = ctx.request.body;
        if (payload.text) {
          const textSplit = payload.text.split(' ');
          if (textSplit.length == 0) {
            ctx.body = HELP;
          } else {
            let params; let settings; let admins;
            switch (textSplit[0]) {
              case 'settings':
                settings = await checkIsSetup(payload.team_id, payload.channel_id, payload.user_id);
                if (!settings) {
                  if (!(await checkIsInChannel(payload.channel_id, payload.response_url))) {
                    ctx.body = MIDDLEWARE_RESPONSE.setup_error;
                    break;
                  }
                } else {
                  admins = await checkIsAdmin(payload.team_id, payload.channel_id, settings, payload.user_id);
                  if (!admins) {
                    ctx.body = MIDDLEWARE_RESPONSE.admin_error(admins);
                    break;
                  }
                }
                const settingsPayload = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Spotbot Settings', 'Submit', 'Cancel');
                params = {
                  Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings: settings, viewId: settingsPayload.view.id, userId: payload.user_id, url: `${ctx.protocol}://${ctx.host}`}),
                  TopicArn: SETTINGS_OPEN,
                };
                await sns.publish(params).promise();
                ctx.body = '';
                break;
              case 'blacklist':
                settings = await checkSettings(payload.team_id, payload.channel_id, payload.user_id, payload.response_url);
                if (!settings) {
                  ctx.body = MIDDLEWARE_RESPONSE.settings_error;
                  break;
                }
                admins = await checkIsAdmin(payload.team_id, payload.channel_id, settings, payload.user_id);
                if (!admins) {
                  ctx.body = MIDDLEWARE_RESPONSE.admin_error(admins);
                  break;
                }
                const blacklistPayload = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, `Spotbot Blacklist`, 'Save', 'Close');
                params = {
                  Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings: settings, viewId: blacklistPayload.view.id, userId: payload.user_id}),
                  TopicArn: SETTINGS_BLACKLIST_OPEN,
                };
                await sns.publish(params).promise();
                ctx.body = '';
                break;
              case 'device':
                settings = await checkSettings(payload.team_id, payload.channel_id, payload.user_id, payload.response_url);
                if (!settings) {
                  ctx.body = MIDDLEWARE_RESPONSE.settings_error;
                  break;
                }
                admins = await checkIsAdmin(payload.team_id, payload.channel_id, settings, payload.user_id);
                if (!admins) {
                  ctx.body = MIDDLEWARE_RESPONSE.admin_error(admins);
                  break;
                }
                const devicePayload = await openModal(payload.team_id, payload.channel_id, payload.trigger_id, EMPTY_MODAL, 'Spotify Devices', 'Switch to Device', 'Cancel');
                params = {
                  Message: JSON.stringify({teamId: payload.team_id, channelId: payload.channel_id, settings: settings, viewId: devicePayload.view.id, userId: payload.user_id}),
                  TopicArn: SETTINGS_DEVICE_SELECT,
                };
                await sns.publish(params).promise();
                ctx.body = '';
                break;
              case 'help':
                ctx.body = HELP;
                break;
              default:
                ctx.body = INVALID;
                break;
            }
          }
        } else {
          ctx.body = HELP;
        }
      });
  return router;
};

