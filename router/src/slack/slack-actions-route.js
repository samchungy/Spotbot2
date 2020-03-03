const config = require(process.env.CONFIG);
const SNS = require('aws-sdk/clients/sns');
const sns = new SNS();
const Lambda = require('aws-sdk/clients/lambda');
const lambda = new Lambda();
const {updateReply} = require('/opt/slack/format/slack-format-reply');
const {reply} = require('/opt/slack/slack-api');
const {checkSettings} = require('../settings/settings-check');
const {isEmpty} = require('/opt/utils/util-objects');
const {openModal} = require('../response/open-modal');

const SLACK_ACTIONS = config.slack.actions;
const AUTH = config.dynamodb.settings_auth;
const CONTROLS = SLACK_ACTIONS.controls;
const OVERFLOW = SLACK_ACTIONS.controller_overflow;
const TRACKS = SLACK_ACTIONS.tracks;
const ARTISTS = SLACK_ACTIONS.artists;

const SETTINGS_AUTH_CHANGE = process.env.SNS_PREFIX + 'settings-auth-change';
const SETTINGS_DEVICE_SWITCH = process.env.SNS_PREFIX + 'settings-device-switch';
const SETTINGS_SUBMIT_VERIFY = process.env.LAMBDA_PREFIX + 'settings-submit-verify';
const SETTINGS_BLACKLIST_SUBMIT_VERIFY = process.env.LAMBDA_PREFIX + 'settings-blacklist-submit-verify';

const CONTROL_RESET_REVIEW_OPEN = process.env.SNS_PREFIX + 'control-reset-review-open';
const CONTROL_RESET_SET = process.env.SNS_PREFIX + 'control-reset-set';

const TRACKS_FIND_ADD = process.env.SNS_PREFIX + 'tracks-find-add';
const TRACKS_FIND_ARTISTS_GET_ARTISTS = process.env.SNS_PREFIX + 'tracks-find-artists-get-artists';
const TRACKS_FIND_ARTISTS_GET_TRACKS = process.env.SNS_PREFIX + 'tracks-find-artists-get-tracks';
const TRACKS_FIND_GET_TRACKS = process.env.SNS_PREFIX + 'tracks-find-get-tracks';
const TRACKS_REMOVE_SUBMIT = process.env.SNS_PREFIX + 'tracks-remove-submit';

const CONTROL_CLEAR_ONE = process.env.SNS_PREFIX + 'control-clear-one';
const CONTROL_JUMP = process.env.SNS_PREFIX + 'control-jump';
const CONTROL_PAUSE = process.env.SNS_PREFIX + 'control-pause';
const CONTROL_PLAY = process.env.SNS_PREFIX + 'control-play';
const CONTROL_SHUFFLE = process.env.SNS_PREFIX + 'control-shuffle';
const CONTROL_SKIP_START = process.env.SNS_PREFIX + 'control-skip-start';
const CONTROL_SKIP_ADD_VOTE = process.env.SNS_PREFIX + 'control-skip-add-vote';
const CONTROL_REPEAT = process.env.SNS_PREFIX + 'control-repeat';
const CONTROL_RESET_START = process.env.SNS_PREFIX + 'control-reset-start';
const CONTROL_RESET_REVIEW_SUBMIT = process.env.SNS_PREFIX + 'control-reset-review-submit';

const MIDDLEWARE_RESPONSE = {
  settings_error: ':information_source: Spotbot is not setup in this channel. Use `/spotbot settings` to setup Spotbot.',
};

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
                    Message: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, viewId: payload.view.id, url: `${ctx.protocol}://${ctx.host}`}),
                    TopicArn: SETTINGS_AUTH_CHANGE,
                  };
                  await sns.publish(params).promise();
                  ctx.body = '';
                  break;
                default:
                  const settings = await checkSettings(payload.team.id, payload.channel.id, payload.user.id, payload.response_url);
                  if (!settings) {
                    ctx.body = MIDDLEWARE_RESPONSE.settings_error;
                    break;
                  }
                  let valuePayload;
                  switch (payload.actions[0].action_id) {
                    case SLACK_ACTIONS.reset_review_confirm:
                      valuePayload = JSON.parse(payload.actions[0].value);
                      const resetPayload = await openModal(payload.team_id, valuePayload.channelId, payload.trigger_id, SLACK_ACTIONS.empty_modal, 'Reset - Tracks Review', 'Confirm', 'Close');
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: valuePayload.channelId, settings, timestamp: valuePayload.timestamp, viewId: resetPayload.view.id, responseUrl: payload.response_url}),
                        TopicArn: CONTROL_RESET_REVIEW_OPEN,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case SLACK_ACTIONS.reset_review_deny:
                      valuePayload = JSON.parse(payload.actions[0].value);
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: valuePayload.channelId, settings, timestamp: valuePayload.timestamp, userId: payload.user.id, jump: false, responseUrl: payload.response_url}),
                        TopicArn: CONTROL_RESET_SET,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;

                    // ARTISTS
                    case ARTISTS.view_artist_tracks:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, userId: payload.user.id, artistId: payload.actions[0].value, triggerId: payload.trigger_id, responseUrl: payload.response_url}),
                        TopicArn: TRACKS_FIND_ARTISTS_GET_TRACKS,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case ARTISTS.see_more_artists:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, userId: payload.user.id, triggerId: payload.actions[0].value, responseUrl: payload.response_url}),
                        TopicArn: TRACKS_FIND_ARTISTS_GET_ARTISTS,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                      // TRACKS
                    case TRACKS.cancel_search: // Artist Search also uses this
                      await reply(
                          updateReply(`:information_source: Search cancelled.`, null),
                          payload.response_url,
                      );
                      ctx.body = '';
                      break;
                    case TRACKS.see_more_results:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, userId: payload.user.id, triggerId: payload.actions[0].value, responseUrl: payload.response_url}),
                        TopicArn: TRACKS_FIND_GET_TRACKS,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case TRACKS.add_to_playlist:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, userId: payload.user.id, trackId: payload.actions[0].value, responseUrl: payload.response_url}),
                        TopicArn: TRACKS_FIND_ADD,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    // CONTROLS
                    case CONTROLS.play:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                        TopicArn: CONTROL_PLAY,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case CONTROLS.pause:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                        TopicArn: CONTROL_PAUSE,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case CONTROLS.skip:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                        TopicArn: CONTROL_SKIP_START,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case SLACK_ACTIONS.skip_vote:
                      params = {
                        Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, userId: payload.user.id, responseUrl: payload.response_url}),
                        TopicArn: CONTROL_SKIP_ADD_VOTE,
                      };
                      await sns.publish(params).promise();
                      ctx.body = '';
                      break;
                    case OVERFLOW:
                      switch (payload.actions[0].selected_option.value) {
                        case CONTROLS.jump_to_start:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: CONTROL_JUMP,
                          };
                          await sns.publish(params).promise();
                          ctx.body = '';
                          break;
                        case CONTROLS.shuffle:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: CONTROL_SHUFFLE,
                          };
                          await sns.publish(params).promise();
                          ctx.body = '';
                          break;
                        case CONTROLS.repeat:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: CONTROL_REPEAT,
                          };
                          await sns.publish(params).promise();
                          ctx.body = '';
                          break;
                        case CONTROLS.reset:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: CONTROL_RESET_START,
                          };
                          await sns.publish(params).promise();
                          ctx.body = '';
                          break;
                        case CONTROLS.clear_one:
                          params = {
                            Message: JSON.stringify({teamId: payload.team.id, channelId: payload.channel.id, settings, timestamp: payload.message.ts, userId: payload.user.id}),
                            TopicArn: CONTROL_CLEAR_ONE,
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
              case SLACK_ACTIONS.empty_modal:
                ctx.body = '';
              // MODALS
              case SLACK_ACTIONS.settings_modal:
                params = {
                  FunctionName: SETTINGS_SUBMIT_VERIFY, // the lambda function we are going to invoke
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
                if (!settings) {
                  ctx.body = MIDDLEWARE_RESPONSE.settings_error;
                  break;
                }
                params = {
                  Message: JSON.stringify({teamId: payload.team.id, channelId, settings, timestamp, view: payload.view, offset, isClose: false, userId: payload.user.id}),
                  TopicArn: CONTROL_RESET_REVIEW_SUBMIT,
                };
                await sns.publish(params).promise();
                ctx.body = '';
                break;
              case SLACK_ACTIONS.blacklist_modal:
                params = {
                  FunctionName: SETTINGS_BLACKLIST_SUBMIT_VERIFY,
                  Payload: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, view: payload.view, userId: payload.user.id}),
                };
                const {Payload: blacklistErrorsPayload} = await lambda.invoke(params).promise();
                errors = JSON.parse(blacklistErrorsPayload);
                if (errors && !isEmpty(errors)) {
                  ctx.body = errors;
                } else {
                  ctx.body = '';
                }
                break;
              case SLACK_ACTIONS.remove_modal:
                settings = await checkSettings(payload.team.id, payload.view.private_metadata, payload.user.id);
                if (!settings) {
                  ctx.body = MIDDLEWARE_RESPONSE.settings_error;
                  break;
                }
                params = {
                  Message: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, settings, userId: payload.user.id, view: payload.view}),
                  TopicArn: TRACKS_REMOVE_SUBMIT,
                };
                await sns.publish(params).promise();
                ctx.body = '';
                break;
              case SLACK_ACTIONS.device_modal:
                settings = await checkSettings(payload.team.id, payload.view.private_metadata, payload.user.id);
                if (!settings) {
                  ctx.body = MIDDLEWARE_RESPONSE.settings_error;
                  break;
                }
                params = {
                  Message: JSON.stringify({teamId: payload.team.id, channelId: payload.view.private_metadata, userId: payload.user.id, view: payload.view}),
                  TopicArn: SETTINGS_DEVICE_SWITCH,
                };
                await sns.publish(params).promise();
                ctx.body = '';
                break;
            }
            break;
          case SLACK_ACTIONS.view_closed:
            switch (payload.view.callback_id) {
              case SLACK_ACTIONS.reset_modal:
                const metadata = payload.view.private_metadata;
                const {channelId, timestamp} = JSON.parse(metadata);
                const settings = await checkSettings(payload.team.id, channelId, payload.user.id);
                if (!settings) {
                  ctx.body = MIDDLEWARE_RESPONSE.settings_error;
                  break;
                }
                params = {
                  Message: JSON.stringify({teamId: payload.team.id, channelId, settings, timestamp, trackUris: null, userId: payload.user.id}),
                  TopicArn: CONTROL_RESET_SET,
                };
                await sns.publish(params).promise();
                ctx.body = '';
                break;
            }
        }
      });

  return router;
};
