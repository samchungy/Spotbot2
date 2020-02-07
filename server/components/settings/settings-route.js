const config = require('config');
const {openSettings, updateView} = require('./settings-controller');
const {checkIsAdmin, checkSettings, isSetup} = require('../settings/settings-middleware');
const {openBlacklistModal} = require('./blacklist/blacklist-controller');
const {openDevicesModal} = require('./device-select/device-controller');
const {validateAuthCode} = require('./spotifyauth/spotifyauth-controller');
const slackVerifyMiddleware = require('../slack/slack-middleware');
const HELP = '*Find Tracks*\n\n`/find [track]` - Find a track on Spotify\n`/artist [artist]` - Find an artist on Spotify\n`/removetracks` - Lists tracks you added to remove from the playlist\n\n*Playback Status*\n\n`/current` - Show the current playing track and it’s position in the playlist\n`/whom` - Show who requested the current track\n\n*Control*\n\n`/control` - Opens the Spotbot control panel\n`/play` - Pauses playback of Spotify\n`/pause`- Pauses playback of Spotify\n`/skip` - Starts a vote to skip a track\n`/reset` - Nukes the playlist\n\n*Admin Commands*\n\n`/spotbot settings` - Opens the Spotbot Settings panel.\n`/spotbot blacklist` - Opens the Spotbot Blacklist panel.\n`/spotbot device` - Opens the Spotbot Device switch panel.';
const INVALID = `:information_source: Invalid Command.`;

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .get('/auth/callback', async (ctx, next) => {
        const {success, failReason, state} = await validateAuthCode(ctx.query.code, ctx.query.state);
        if (success) {
          ctx.body = 'Authentication Successful. Please close this window';
          updateView(state.teamId, state.channelId);
        } else {
          ctx.status = 401;
          ctx.body = failReason;
        }
      })
      .use(slackVerifyMiddleware)
      .post('/', async (ctx, next) => {
        const payload = ctx.request.body;
        if (payload.text) {
          const textSplit = payload.text.split(' ');
          if (textSplit.length == 0) {
            ctx.body = HELP;
          } else {
            switch (textSplit[0]) {
              case 'settings':
                if (!await isSetup(payload.team_id, payload.channel_id) || await checkIsAdmin(payload.team_id, payload.channel_id, payload.user_id, payload.response_url)) {
                  openSettings(payload.team_id, payload.channel_id, payload.trigger_id);
                }
                ctx.body = '';
                break;
              case 'blacklist':
                if (await checkSettings(payload.team_id, payload.channel_id, payload.response_url) && await checkIsAdmin(payload.team_id, payload.channel_id, payload.user_id, payload.response_url)) {
                  openBlacklistModal(payload.team_id, payload.channel_id, payload.trigger_id);
                }
                ctx.body = '';
                break;
              case 'device':
                if (await checkSettings(payload.team_id, payload.channel_id, payload.response_url) && await checkIsAdmin(payload.team_id, payload.channel_id, payload.user_id, payload.response_url)) {
                  openDevicesModal(payload.team_id, payload.channel_id, payload.user_id, payload.trigger_id);
                }
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

