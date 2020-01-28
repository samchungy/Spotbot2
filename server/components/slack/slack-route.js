const config = require('config');
const SLACK_ACTIONS = config.get('slack.actions');
const PLAYLIST = config.get('dynamodb.settings.playlist');
const DEFAULT_DEVICE = config.get('dynamodb.settings.default_device');
const TIMEZONE = config.get('dynamodb.settings.timezone');
const AUTH_URL = config.get('dynamodb.settings_auth.auth_url');
const REAUTH = config.get('dynamodb.settings_auth.reauth');
const CONTROLS = config.get('slack.actions.controls');
const OVERFLOW = config.get('slack.actions.controller_overflow');
const CANCEL = config.get('slack.actions.tracks.cancel_search');
const MORE_TRACKS = config.get('slack.actions.tracks.see_more_results');
const MORE_ARTISTS = config.get('slack.actions.artists.see_more_artists');
const ADD_TRACK = config.get('slack.actions.tracks.add_to_playlist');
const VIEW_ARTIST = config.get('slack.actions.artists.view_artist_tracks');

const {checkSettings} = require('../settings/settings-middleware');
const {changeAuthentication, getAllDevices, getAllPlaylists, getAllTimezones, saveSettings, saveView, updateView} = require('../settings/settings-controller');
const {clearOneDay, jumpToStart, pause, play, reset, skip, toggleRepeat, toggleShuffle, verifyResetReview, voteToSkip} = require('../control/control-controller');
const {getMoreArtists, getMoreTracks, cancelSearch, removeTracks, setTrack, viewArtist} = require('../tracks/tracks-controller');
const {saveBlacklist} = require('../settings/blacklist/blacklist-controller');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .post('/', async (ctx, next) => {
        const payload = JSON.parse(ctx.request.body.payload);
        switch (payload.type) {
          case SLACK_ACTIONS.block_actions:
            if (payload.actions.length > 0) {
              switch (payload.actions[0].action_id) {
                // AUTH
                case AUTH_URL:
                  saveView(payload.team.id, payload.view.private_metadata, payload.view.id, payload.trigger_id);
                  ctx.body = '';
                  break;
                case REAUTH:
                  await changeAuthentication(payload.team.id, payload.view.private_metadata);
                  updateView(payload.team.id, payload.view.private_metadata, payload.view.id, payload.trigger_id);
                  ctx.body = '';
                  break;
                default:
                  if (!await checkSettings(payload.team.id, payload.channel.id, null, payload.user.id)) {
                    ctx.body = '';
                    break;
                  }
                  switch (payload.actions[0].action_id) {
                    // ARTISTS
                    case VIEW_ARTIST:
                      viewArtist(payload.team.id, payload.channel.id, payload.actions[0].value, payload.response_url, payload.trigger_id);
                      ctx.body = '';
                      break;
                    case MORE_ARTISTS:
                      getMoreArtists(payload.team.id, payload.channel.id, payload.actions[0].value, payload.response_url);
                      ctx.body = '';
                      break;
                      // TRACKS
                    case CANCEL:
                      cancelSearch(payload.response_url);
                      ctx.body = '';
                      break;
                    case MORE_TRACKS:
                      getMoreTracks(payload.team.id, payload.channel.id, payload.actions[0].value, payload.response_url);
                      ctx.body = '';
                      break;
                    case ADD_TRACK:
                      setTrack(payload.team.id, payload.channel.id, payload.user.id, payload.actions[0].value, payload.response_url);
                      ctx.body = '';
                      break;

                      // CONTROLS
                    case CONTROLS.play:
                      play(payload.team.id, payload.channel.id, payload.message.ts);
                      ctx.body = '';
                      break;
                    case CONTROLS.pause:
                      pause(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id);
                      ctx.body = '';
                      break;
                    case CONTROLS.skip:
                      skip(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id);
                      ctx.body = '';
                      break;
                    case SLACK_ACTIONS.skip_vote:
                      voteToSkip(payload.team.id, payload.channel.id, payload.user.id, payload.actions[0].value, payload.response_url);
                      ctx.body = '';
                      break;
                    case OVERFLOW:
                      switch (payload.actions[0].selected_option.value) {
                        case CONTROLS.jump_to_start:
                          jumpToStart(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id);
                          ctx.body = '';
                          break;
                        case CONTROLS.shuffle:
                          toggleShuffle(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id);
                          ctx.body = '';
                          break;
                        case CONTROLS.repeat:
                          toggleRepeat(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id);
                          ctx.body = '';
                          break;
                        case CONTROLS.reset:
                          reset(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id, payload.trigger_id);
                          ctx.body = '';
                          break;
                        case CONTROLS.clear_one:
                          clearOneDay(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id);
                          ctx.body = '';
                          break;
                      }
                      break;
                  }
                  break;
              }
              break;
            }
          case SLACK_ACTIONS.view_submission:
            switch (payload.view.callback_id) {
              // MODALS
              case SLACK_ACTIONS.settings_modal:
                const errors = await saveSettings(payload.team.id, payload.view.private_metadata, payload.view, payload.user.id);
                if (errors) {
                  ctx.body = errors;
                } else {
                  ctx.body = '';
                }
                break;
              case SLACK_ACTIONS.reset_review:
                const metadata = payload.view.private_metadata;
                const {channelId} = JSON.parse(metadata);
                if (await checkSettings(payload.team.id, channelId, null, payload.user.id)) {
                  verifyResetReview(false, payload.view, payload.user.id);
                }
                ctx.body = '';
                break;
              case SLACK_ACTIONS.blacklist_modal:
                if (await checkSettings(payload.team.id, payload.view.private_metadata, null, payload.user.id)) {
                  saveBlacklist(payload.view, payload.user.id);
                }
                ctx.body = '';
                break;
              case SLACK_ACTIONS.remove_modal:
                if (await checkSettings(payload.team.id, payload.view.private_metadata, null, payload.user.id)) {
                  removeTracks(payload.team.id, payload.view.private_metadata, payload.user.id, payload.view);
                }
                ctx.body = '';
                break;
            }
            break;
          case SLACK_ACTIONS.view_closed:
            switch (payload.view.callback_id) {
              case SLACK_ACTIONS.reset_review:
                verifyResetReview(true, payload.view, payload.user.id);
                ctx.body = '';
                break;
            }
        }
      })
      .post('/options', async (ctx, next) =>{
        const payload = JSON.parse(ctx.request.body.payload);
        let options;
        switch (payload.action_id) {
          case PLAYLIST:
            options = await getAllPlaylists(payload.team.id, payload.view.private_metadata, payload.value);
            ctx.body = options;
            break;
          case DEFAULT_DEVICE:
            options = await getAllDevices(payload.team.id, payload.view.private_metadata);
            ctx.body = options;
            break;
          case TIMEZONE:
            options = await getAllTimezones(payload.value);
            ctx.body = options;
            break;
        }
      });

  return router;
};
