const config = require(process.env.CONFIG);
const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();
const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda();

const {isEmpty} = require('/opt/utils/util-objects');

const SLACK_ACTIONS = config.slack.actions;
const AUTH = config.dynamodb.settings_auth;
const CONTROLS = SLACK_ACTIONS.controls;
const OVERFLOW = SLACK_ACTIONS.controller_overflow;
// const TRACKS = SLACK_ACTIONS.tracks;
// const ARTISTS = SLACK_ACTIONS.artists;

const {checkSettings} = require('../settings/settings-check');
// const {getAllDevices, getAllPlaylists, getAllTimezones, saveSettings, updateView} = require('../server/components/settings/settings-controller');
// const {changeAuthentication, saveView} = require('../server/components/settings/spotifyauth/spotifyauth-controller');
// const {clearOneDay, jumpToStart, pause, play, reset, skip, toggleRepeat, toggleShuffle, verifyResetReview, voteToSkip} = require('../server/components/control/control-controller');
// const {getMoreArtists, getMoreTracks, cancelSearch, removeTracks, setTrack, viewArtist} = require('../server/components/tracks/tracks-controller');
// const {saveBlacklist} = require('../server/components/settings/blacklist/blacklist-controller');
// const {switchDevice} = require('../server/components/settings/device-select/device-controller');

module.exports = ( prefix, Router ) => {
  const router = new Router({
    prefix: prefix,
  });
  router
      .post('/', async (ctx, next) => {
        let params;
        const payload = JSON.parse(ctx.request.body.payload);
        switch (payload.type) {
          case SLACK_ACTIONS.block_actions:
            if (payload.actions.length > 0) {
              switch (payload.actions[0].action_id) {
                // AUTH
                case AUTH.auth_url:
                  ctx.body = '';
                  break;
                case AUTH.reauth:
                  params = {
                    Message: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, viewId: payload.view.id}),
                    TopicArn: process.env.SETTINGS_AUTH_CHANGE,
                  };
                  await sns.publish(params).promise();
                  ctx.body = '';
                  break;
                default:
                  // if (!await checkSettings(payload.team.id, payload.channel.id, null, payload.user.id)) {
                  //   ctx.body = '';
                  //   break;
                  // }
                  switch (payload.actions[0].action_id) {
                  //   // ARTISTS
                  //   case ARTISTS.view_artist_tracks:
                  //     viewArtist(payload.team.id, payload.channel.id, payload.actions[0].value, payload.response_url, payload.trigger_id);
                  //     ctx.body = '';
                  //     break;
                  //   case ARTISTS.see_more_artists:
                  //     getMoreArtists(payload.team.id, payload.channel.id, payload.actions[0].value, payload.response_url);
                  //     ctx.body = '';
                  //     break;
                  //     // TRACKS
                  //   case TRACKS.cancel_search: // Artist Search also uses this
                  //     cancelSearch(payload.response_url);
                  //     ctx.body = '';
                  //     break;
                  //   case TRACKS.see_more_results:
                  //     getMoreTracks(payload.team.id, payload.channel.id, payload.actions[0].value, payload.response_url);
                  //     ctx.body = '';
                  //     break;
                  //   case TRACKS.add_to_playlist:
                  //     setTrack(payload.team.id, payload.channel.id, payload.user.id, payload.actions[0].value, payload.response_url);
                  //     ctx.body = '';
                  //     break;
                  //     // CONTROLS
                    case CONTROLS.play:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, timestamp: payload.message.ts, userId: payload.user.id}),
                        TopicArn: process.env.CONTROL_PLAY,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case CONTROLS.pause:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, timestamp: payload.message.ts, userId: payload.user.id}),
                        TopicArn: process.env.CONTROL_PAUSE,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                      //   case CONTROLS.skip:
                      //     skip(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id);
                      //     ctx.body = '';
                      //     break;
                      //   case SLACK_ACTIONS.skip_vote:
                      //     voteToSkip(payload.team.id, payload.channel.id, payload.user.id, payload.actions[0].value, payload.response_url);
                      //     ctx.body = '';
                      //     break;
                    case OVERFLOW:
                      switch (payload.actions[0].selected_option.value) {
                        //       case CONTROLS.jump_to_start:
                        //         jumpToStart(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id);
                        //         ctx.body = '';
                        //         break;
                        case CONTROLS.shuffle:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: process.env.CONTROL_SHUFFLE,
                          };
                          await sns.publish(params).promise();
                          ctx.body = '';
                          break;
                        case CONTROLS.repeat:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: process.env.CONTROL_REPEAT,
                          };
                          await sns.publish(params).promise();
                          ctx.body = '';
                          break;
                        //       case CONTROLS.reset:
                        //         reset(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id, payload.trigger_id);
                        //         ctx.body = '';
                        //         break;
                        //       case CONTROLS.clear_one:
                        //         clearOneDay(payload.team.id, payload.channel.id, payload.message.ts, payload.user.id);
                        //         ctx.body = '';
                        //         break;
                      }
                      break;
                  }
                  break;
              }
              break;
            }
          case SLACK_ACTIONS.view_submission:
            let errors;
            switch (payload.view.callback_id) {
              // MODALS
              case SLACK_ACTIONS.settings_modal:
                params = {
                  FunctionName: process.env.SETTINGS_SUBMIT_VERIFY, // the lambda function we are going to invoke
                  Payload: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, view: payload.view, userId: payload.user.id}),
                };
                const {Payload: settingsErrorsPayload} = await lambda.invoke(params).promise();
                errors = JSON.parse(settingsErrorsPayload);
                if (errors && !isEmpty(errors)) {
                  ctx.body = errors;
                } else {
                  ctx.body = '';
                }
                break;
                // case SLACK_ACTIONS.reset_review:
                //   const metadata = payload.view.private_metadata;
                //   const {channelId} = JSON.parse(metadata);
                //   if (await checkSettings(payload.team.id, channelId, payload.user.id)) {
                //     verifyResetReview(false, payload.view, payload.user.id);
                //   }
                //   ctx.body = '';
                //   break;
                // case SLACK_ACTIONS.blacklist_modal:
                //   if (await checkSettings(payload.team.id, payload.view.private_metadata, payload.user.id)) {
                //     const errors = await saveBlacklist(payload.view, payload.user.id);
                //     if (errors) {
                //       ctx.body = errors;
                //     } else {
                //       ctx.body = '';
                //     }
                //   }
                //   break;

              // case SLACK_ACTIONS.remove_modal:
              //   if (await checkSettings(payload.team.id, payload.view.private_metadata, payload.user.id)) {
              //     removeTracks(payload.team.id, payload.view.private_metadata, payload.user.id, payload.view);
              //   }
              //   ctx.body = '';
              //   break;
              case SLACK_ACTIONS.device_modal:
                if (await checkSettings(payload.team.id, payload.view.private_metadata, payload.user.id)) {
                  params = {
                    Message: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, userId: payload.user.id, view: payload.view}),
                    TopicArn: process.env.SETTINGS_DEVICE_SWITCH,
                  };
                  await sns.publish(params).promise();
                  ctx.body = '';
                  break;
                }
            }
            break;
          case SLACK_ACTIONS.view_closed:
            // switch (payload.view.callback_id) {
            //   case SLACK_ACTIONS.reset_review:
            //     verifyResetReview(true, payload.view, payload.user.id);
            //     ctx.body = '';
            //     break;
            // }
        }
      });

  return router;
};
