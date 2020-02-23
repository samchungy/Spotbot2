const config = require(process.env.CONFIG);
const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();
const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda();

const {isEmpty} = require('/opt/utils/util-objects');
const {openModal} = require('../response/open-modal');

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
                  const settings = await checkSettings(payload.team.id, payload.channel.id, payload.user.id);
                  if (!settings) {
                    ctx.body = '';
                    break;
                  }
                  let valuePayload;
                  switch (payload.actions[0].action_id) {
                    case SLACK_ACTIONS.reset_review_confirm:
                      valuePayload = JSON.parse(payload.actions[0].value);
                      const resetPayload = await openModal(payload.team_id, valuePayload.channelId, payload.trigger_id, SLACK_ACTIONS.reset_modal, 'Reset - Tracks Review', 'Confirm', 'Close');
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: valuePayload.channelId, settings, timestamp: valuePayload.timestamp, viewId: resetPayload.view.id, responseUrl: payload.response_url}),
                        TopicArn: process.env.CONTROL_RESET_REVIEW_OPEN,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case SLACK_ACTIONS.reset_review_deny:
                      valuePayload = JSON.parse(payload.actions[0].value);
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: valuePayload.channelId, settings, timestamp: valuePayload.timestamp, userId: payload.user.id, jump: false, responseUrl: payload.response_url}),
                        TopicArn: process.env.CONTROL_RESET_SET,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;

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
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                        TopicArn: process.env.CONTROL_PLAY,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case CONTROLS.pause:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                        TopicArn: process.env.CONTROL_PAUSE,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case CONTROLS.skip:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                        TopicArn: process.env.CONTROL_SKIP_START,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case SLACK_ACTIONS.skip_vote:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, userId: payload.user.id, responseUrl: payload.response_url}),
                        TopicArn: process.env.CONTROL_SKIP_ADD_VOTE,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case OVERFLOW:
                      switch (payload.actions[0].selected_option.value) {
                        case CONTROLS.jump_to_start:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: process.env.CONTROL_JUMP,
                          };
                          await sns.publish(params).promise();
                          ctx.body = '';
                          break;
                        case CONTROLS.shuffle:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: process.env.CONTROL_SHUFFLE,
                          };
                          await sns.publish(params).promise();
                          ctx.body = '';
                          break;
                        case CONTROLS.repeat:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: process.env.CONTROL_REPEAT,
                          };
                          await sns.publish(params).promise();
                          ctx.body = '';
                          break;
                        case CONTROLS.reset:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: process.env.CONTROL_RESET_START,
                          };
                          await sns.publish(params).promise();
                          ctx.body = '';
                          break;
                        case CONTROLS.clear_one:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: process.env.CONTROL_CLEAR_ONE,
                          };
                          await sns.publish(params).promise();
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
            let errors; let settings;
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
              case SLACK_ACTIONS.reset_modal:
                const metadata = payload.view.private_metadata;
                const {channelId, timestamp, offset} = JSON.parse(metadata);
                settings = await checkSettings(payload.team.id, channelId, payload.user.id);
                if (settings) {
                  params = {
                    Message: JSON.stringify({teamId: payload.team.id, channelId, settings, timestamp, view: payload.view, offset, isClose: false, userId: payload.user.id}),
                    TopicArn: process.env.CONTROL_RESET_REVIEW_SUBMIT,
                  };
                  await sns.publish(params).promise();
                }
                ctx.body = '';
                break;
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
